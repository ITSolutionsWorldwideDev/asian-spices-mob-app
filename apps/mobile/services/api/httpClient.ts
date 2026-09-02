import { API_BASE } from "@/services/api/apiBase";

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
    error?: string;
    message?: string;
  } & T;

  if (!response.ok) {
    throw new ApiRequestError(
      payload.error ?? payload.message ?? "Request failed",
      response.status,
    );
  }

  return payload;
}
