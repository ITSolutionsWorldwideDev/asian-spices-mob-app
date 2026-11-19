import { API_BASE } from "@/shared/services/api/apiBase";

export class ApiRequestError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

const REQUEST_TIMEOUT_MS = 10000;

function toErrorMessage(value: unknown, fallback = "Request failed"): string {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  if (value && typeof value === "object") {
    const record = value as {
      message?: unknown;
      formErrors?: unknown;
      fieldErrors?: Record<string, unknown>;
    };

    if (typeof record.message === "string" && record.message.trim()) {
      return record.message;
    }

    if (record.fieldErrors && typeof record.fieldErrors === "object") {
      for (const messages of Object.values(record.fieldErrors)) {
        if (!Array.isArray(messages)) continue;
        const first = messages.find(
          (item) => typeof item === "string" && item.trim().length > 0,
        );
        if (typeof first === "string") return first;
      }
    }

    if (Array.isArray(record.formErrors)) {
      const first = record.formErrors.find(
        (item) => typeof item === "string" && item.trim().length > 0,
      );
      if (typeof first === "string") return first;
    }
  }

  return fallback;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  let response: Response;
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      credentials: options.credentials ?? "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(options.headers ?? {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiRequestError(
        `Request timed out. Check API at ${API_BASE} and EXPO_PUBLIC_NEXT_API_URL.`,
      );
    }
    throw new ApiRequestError(
      `Cannot reach API at ${API_BASE}. Start backend and use your LAN IP in EXPO_PUBLIC_NEXT_API_URL.`,
    );
  } finally {
    clearTimeout(timeoutHandle);
  }

  const payload = (await response.json().catch(() => ({}))) as {
    error?: unknown;
    message?: unknown;
  } & T;

  if (!response.ok) {
    throw new ApiRequestError(
      toErrorMessage(payload.error ?? payload.message),
      response.status,
    );
  }

  return payload;
}
