import { NextResponse } from "next/server";
import type { ChatRequest } from "@/types/chat";

export const runtime = "nodejs";

// const DEFAULT_N8N_WEBHOOK_URL =
//   "https://n8n.srv1133883.hstgr.cloud/webhook/asiantest";

const DEFAULT_N8N_WEBHOOK_URL =
  "https://n8n-b8rr.srv1769324.hstgr.cloud/webhook/asiantest";

const N8N_WEBHOOK_URL =
  process.env.BIBI_N8N_WEBHOOK_URL?.trim() ??
  DEFAULT_N8N_WEBHOOK_URL;
const N8N_TIMEOUT_MS = Number.parseInt(
  process.env.BIBI_N8N_TIMEOUT_MS?.trim() ?? "25000",
  10,
);

type N8nNormalizedResponse = {
  reply: string;
  conversationId: string | null;
  connectionStatus: "connected";
  endpointUrl: string | null;
  csvUrl?: string | null;
  previewTable?: Array<Record<string, string | number | boolean | null>> | null;
  images?: Array<{ url: string; alt?: string | null }> | null;
  videos?: Array<{ url: string; title?: string | null; poster?: string | null }> | null;
};

type UnknownRecord = Record<string, unknown>;
const INTERNAL_TOOL_TRACE_PATTERNS = [
  /^calling tools:/i,
  /^tool(?:\s|:)/i,
  /\bintermediateSteps\b/i,
  /\bSelect rows from a table in Postgres\b/i,
  /\btoolInput\b/i,
  /\btoolName\b/i,
];

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function unwrapN8nPayload(payload: unknown): UnknownRecord {
  if (Array.isArray(payload)) {
    return unwrapN8nPayload(payload[0]);
  }

  const record = asRecord(payload);
  if (!record) {
    return {};
  }

  const jsonRecord = asRecord(record.json);
  if (jsonRecord) {
    return unwrapN8nPayload(jsonRecord);
  }

  const bodyRecord = asRecord(record.body);
  if (bodyRecord) {
    return unwrapN8nPayload(bodyRecord);
  }

  return record;
}

function normalizePayload(
  payload: unknown,
  fallbackConversationId: string | null,
): N8nNormalizedResponse {
  const record = unwrapN8nPayload(payload);
  const reply = extractReply(payload);

  if (!reply) {
    throw new Error(
      "Bibi returned an internal tool log instead of a customer-facing reply.",
    );
  }

  return {
    reply,
    conversationId:
      asString(record.sessionId) ??
      asString(record.session_id) ??
      fallbackConversationId,
    connectionStatus: "connected",
    endpointUrl: N8N_WEBHOOK_URL || null,
    csvUrl: asString(record.csvUrl) ?? asString(record.csv_url),
    previewTable: asPreviewTable(record.previewTable) ?? asPreviewTable(record.preview_table),
    images: asImages(record.images),
    videos: asVideos(record.videos),
  };
}

function createWebhookBody(request: ChatRequest, sessionId: string) {
  return {
    message: request.message,
    chatInput: request.message,
    conversationId: sessionId,
    sessionId,
    session_id: sessionId,
    metadata: request.metadata ?? null,
  };
}

function createMethodHelpResponse(status = 200) {
  return NextResponse.json(
    {
      ok: true,
      route: "/api/chat",
      allowedMethods: ["GET", "POST", "OPTIONS"],
      message:
        "Use POST /api/chat with a JSON body like { \"message\": \"Hello\", \"conversationId\": null }.",
      webhookUrl: N8N_WEBHOOK_URL || null,
    },
    { status },
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const message = searchParams.get("message")?.trim();
  const conversationId = searchParams.get("conversationId")?.trim() ?? null;

  if (!message) {
    return createMethodHelpResponse();
  }

  return POST(
    new Request(request.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        conversationId,
        metadata: {
          source: "bibi-frontend",
          company: "Asian Spices",
          agent: "Bibi",
        },
      } satisfies ChatRequest),
    }),
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: "GET, POST, OPTIONS",
    },
  });
}

export async function POST(request: Request) {
  let body: ChatRequest;

  try {
    body = (await request.json()) as ChatRequest;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  if (!body?.message || typeof body.message !== "string" || !body.message.trim()) {
    return NextResponse.json(
      { error: "A non-empty `message` field is required." },
      { status: 400 },
    );
  }

  if (!N8N_WEBHOOK_URL) {
    return NextResponse.json(
      {
        error:
          "BIBI_N8N_WEBHOOK_URL is not configured on the server, so the live Bibi chat flow is unavailable.",
      },
      { status: 503 },
    );
  }

  const controller = new AbortController();
  const conversationId = body.conversationId ?? crypto.randomUUID();
  const timeout = setTimeout(
    () => controller.abort("BIBI_N8N_TIMEOUT"),
    Number.isFinite(N8N_TIMEOUT_MS) ? N8N_TIMEOUT_MS : 25000,
  );

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createWebhookBody(body, conversationId)),
      signal: controller.signal,
      cache: "no-store",
    });

    const text = await response.text();
    const payload = text ? safeJsonParse(text) : null;

    if (!response.ok) {
      const message = extractErrorMessage(payload) ?? text;
      const friendlyMessage =
        response.status === 404
          ? `The n8n webhook URL is reachable, but this webhook path is not registered: ${N8N_WEBHOOK_URL}. Activate the workflow or verify the exact webhook path and HTTP method in n8n.`
          : message;
      return NextResponse.json(
        {
          error:
            friendlyMessage ||
            `The n8n webhook responded with status ${response.status}.`,
        },
        { status: response.status },
      );
    }

    return NextResponse.json(normalizePayload(payload, conversationId));
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? `Bibi took too long to respond. The n8n webhook exceeded the ${N8N_TIMEOUT_MS}ms timeout.`
        : error instanceof Error
          ? error.message
          : "Bibi couldn't reach the chat service.";

    return NextResponse.json({ error: message }, { status: 504 });
  } finally {
    clearTimeout(timeout);
  }
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractErrorMessage(payload: unknown) {
  if (typeof payload === "string") {
    return payload.trim() || null;
  }

  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const dataRecord = asRecord(record.data);
  const nestedError =
    record.error && typeof record.error === "object"
      ? (record.error as Record<string, unknown>)
      : null;

  return (
    asString(record.error) ??
    asString(record.message) ??
    asString(record.content) ??
    asString(dataRecord?.error) ??
    asString(dataRecord?.message) ??
    (nestedError ? asString(nestedError.message) : null)
  );
}

function extractReply(payload: unknown) {
  if (typeof payload === "string") {
    const reply = payload.trim();
    return reply && !looksLikeInternalToolTrace(reply) ? reply : null;
  }

  const record = unwrapN8nPayload(payload);
  const dataRecord = asRecord(record.data);
  const candidates = [
    dataRecord?.answer,
    dataRecord?.output,
    dataRecord?.message,
    dataRecord?.text,
    record.answer,
    record.output,
    record.message,
    record.reply,
    record.text,
    asRecord(record.output)?.text,
  ];

  for (const candidate of candidates) {
    const reply = asString(candidate);
    if (reply && !looksLikeInternalToolTrace(reply)) {
      return reply;
    }
  }

  return null;
}

function looksLikeInternalToolTrace(value: string) {
  const normalized = value.trim();
  return INTERNAL_TOOL_TRACE_PATTERNS.some((pattern) => pattern.test(normalized));
}

function asPreviewTable(value: unknown) {
  if (!Array.isArray(value)) {
    return null;
  }

  const rows = value.filter(
    (entry): entry is Record<string, string | number | boolean | null> =>
      Boolean(entry) && typeof entry === "object" && !Array.isArray(entry),
  );

  return rows.length ? rows : null;
}

function asImages(value: unknown) {
  if (!Array.isArray(value)) {
    return null;
  }

  const images = value
    .map((entry) => {
      if (typeof entry === "string") {
        return { url: entry, alt: null };
      }

      const record = asRecord(entry);
      const url = asString(record?.url);
      if (!url) {
        return null;
      }

      return {
        url,
        alt: asString(record?.alt),
      };
    })
    .filter((entry): entry is { url: string; alt: string | null } => Boolean(entry));

  return images.length ? images : null;
}

function asVideos(value: unknown) {
  if (!Array.isArray(value)) {
    return null;
  }

  const videos = value
    .map((entry) => {
      if (typeof entry === "string") {
        return { url: entry, title: null, poster: null };
      }

      const record = asRecord(entry);
      const url = asString(record?.url);
      if (!url) {
        return null;
      }

      return {
        url,
        title: asString(record?.title),
        poster: asString(record?.poster),
      };
    })
    .filter(
      (
        entry,
      ): entry is { url: string; title: string | null; poster: string | null } => Boolean(entry),
    );

  return videos.length ? videos : null;
}
