import type {
  BackendConnectionStatus,
  BibiApiResult,
  ChatRequest,
} from "@/types/chat";

const ENDPOINT_URL = "/api/chat";
const SESSION_STORAGE_KEY = "bibi-chat-session-id";

export class BibiClientError extends Error {
  connectionStatus: BackendConnectionStatus;
  endpointUrl: string | null;

  constructor(
    message: string,
    options: {
      connectionStatus?: BackendConnectionStatus;
      endpointUrl?: string | null;
    } = {},
  ) {
    super(message);
    this.name = "BibiClientError";
    this.connectionStatus = options.connectionStatus ?? "unreachable";
    this.endpointUrl = options.endpointUrl ?? ENDPOINT_URL;
  }
}

export class N8nChatService {
  private readonly endpointUrl: string;
  private readonly storageKey: string;

  constructor(options?: { endpointUrl?: string; storageKey?: string }) {
    this.endpointUrl = options?.endpointUrl ?? ENDPOINT_URL;
    this.storageKey = options?.storageKey ?? SESSION_STORAGE_KEY;
  }

  getOrCreateSessionId() {
    if (typeof window === "undefined") {
      return crypto.randomUUID();
    }

    const stored = window.localStorage.getItem(this.storageKey)?.trim();
    if (stored) {
      return stored;
    }

    const sessionId = crypto.randomUUID();
    window.localStorage.setItem(this.storageKey, sessionId);
    return sessionId;
  }

  setSessionId(sessionId: string) {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(this.storageKey, sessionId);
  }

  async sendMessage(request: ChatRequest): Promise<BibiApiResult> {
    const sessionId = request.conversationId ?? this.getOrCreateSessionId();
    this.setSessionId(sessionId);

    let response: Response;

    try {
      response = await fetch(this.endpointUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: request.message,
          sessionId,
        }),
        cache: "no-store",
      });
    } catch (error) {
      throw new BibiClientError(
        error instanceof Error
          ? `Bibi couldn't reach the chat service. ${error.message}`
          : "Bibi couldn't reach the chat service. Please try again.",
      );
    }

    const rawText = await response.text();

    if (!response.ok) {
      throw new BibiClientError(
        extractErrorMessage(rawText) ??
          `Bibi couldn't send your message right now. Server returned ${response.status}.`,
      );
    }

    if (!rawText.trim()) {
      throw new BibiClientError(
        "Bibi didn't send a response. Please try again in a moment.",
      );
    }

    const payload = safeJsonParse(rawText);
    const reply = extractReply(payload, rawText);

    if (!reply) {
      throw new BibiClientError(
        "Bibi sent a response in an unexpected format. Please try again.",
      );
    }

    const record = unwrapN8nPayload(payload);

    return {
      reply,
      conversationId:
        asString(record.sessionId) ??
        asString(record.session_id) ??
        sessionId,
      isMock: false,
      connectionStatus: "connected",
      endpointUrl: this.endpointUrl,
      csvUrl: asString(record.csvUrl) ?? asString(record.csv_url),
      previewTable: asPreviewTable(record.previewTable) ?? asPreviewTable(record.preview_table),
      images: asImages(record.images),
      videos: asVideos(record.videos),
      raw: payload ?? rawText,
    };
  }
}

const defaultChatService = new N8nChatService();

export function getStoredChatSessionId() {
  return defaultChatService.getOrCreateSessionId();
}

export function resetStoredChatSessionId() {
  const sessionId = crypto.randomUUID();
  defaultChatService.setSessionId(sessionId);
  return sessionId;
}

export async function sendChatMessage(request: ChatRequest): Promise<BibiApiResult> {
  return defaultChatService.sendMessage(request);
}

function extractErrorMessage(rawText: string) {
  const payload = safeJsonParse(rawText);
  if (typeof payload === "string") {
    return payload.trim() || null;
  }

  if (!payload || typeof payload !== "object") {
    return rawText.trim() || null;
  }

  const record = payload as Record<string, unknown>;
  return (
    asString(record.error) ??
    asString(record.message) ??
    asString(asRecord(record.data)?.error) ??
    asString(asRecord(record.data)?.message) ??
    asString(record.content) ??
    rawText.trim() ??
    null
  );
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function unwrapN8nPayload(payload: unknown): Record<string, unknown> {
  if (Array.isArray(payload)) {
    return unwrapN8nPayload(payload[0]);
  }

  if (!payload || typeof payload !== "object") {
    return {};
  }

  const record = payload as Record<string, unknown>;
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

function extractReply(payload: unknown, rawText: string) {
  if (typeof payload === "string") {
    return payload.trim() || null;
  }

  const record = unwrapN8nPayload(payload);
  const dataRecord = asRecord(record.data);

  return (
    asString(dataRecord?.answer) ??
    asString(dataRecord?.output) ??
    asString(dataRecord?.message) ??
    asString(record.answer) ??
    asString(record.output) ??
    asString(record.message) ??
    asString(record.reply) ??
    rawText.trim() ??
    null
  );
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
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
