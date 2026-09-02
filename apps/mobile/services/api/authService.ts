import { API_BASE } from "@/services/api/apiBase";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type AuthUser = {
  id: string;
  name?: string | null;
  email: string;
  isPlatformAdmin?: boolean;
  storeRoles?: Array<{
    store_id: string;
    role: string;
    slug: string;
  }>;
};

export type AuthResponse = {
  success?: boolean;
  token?: string | null;
  user: AuthUser;
};

const AUTH_USER_STORAGE_KEY = "@asian_spices_auth_user";
const AUTH_TOKEN_STORAGE_KEY = "@asian_spices_auth_token";
const AUTH_CREDENTIALS_STORAGE_KEY = "@asian_spices_auth_credentials";

class AuthApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthApiError";
  }
}

type NextAuthCsrfResponse = {
  csrfToken?: string;
};

type NextAuthSessionResponse = {
  user?: {
    id?: string;
    email?: string;
  } | null;
};

async function post<T>(path: string, body: unknown): Promise<T> {
  const controller = new AbortController();
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<Response>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      controller.abort();
      reject(new AuthApiError("Login request timed out. Please try again."));
    }, 30000);
  });

  let response: Response;
  try {
    response = await Promise.race([
      fetch(`${API_BASE}${path}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      }),
      timeoutPromise,
    ]);
  } catch (error) {
    if (error instanceof AuthApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new AuthApiError("Login request timed out. Please try again.");
    }

    throw new AuthApiError(
      `Cannot reach API at ${API_BASE}. Start backend and use your LAN IP in EXPO_PUBLIC_NEXT_API_URL.`,
    );
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
  } & T;

  if (!response.ok) {
    throw new AuthApiError(payload.error ?? "Request failed");
  }

  return payload;
}

async function ensureNextAuthSession(email: string, password: string): Promise<void> {
  const csrfRes = await fetch(`${API_BASE}/api/auth/csrf`, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  const csrfPayload = (await csrfRes.json().catch(() => ({}))) as NextAuthCsrfResponse;
  const csrfToken = csrfPayload.csrfToken;

  if (!csrfRes.ok || !csrfToken) {
    throw new AuthApiError("Could not initialize account session. Please try again.");
  }

  const callbackBody = new URLSearchParams();
  callbackBody.set("csrfToken", csrfToken);
  callbackBody.set("email", email);
  callbackBody.set("password", password);
  callbackBody.set("callbackUrl", `${API_BASE}/`);
  callbackBody.set("json", "true");

  const callbackRes = await fetch(`${API_BASE}/api/auth/callback/credentials`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: callbackBody.toString(),
  });

  if (!callbackRes.ok) {
    throw new AuthApiError(
      "Login succeeded, but account session could not be established for protected APIs.",
    );
  }

  const sessionRes = await fetch(`${API_BASE}/api/auth/session`, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });
  const sessionPayload = (await sessionRes.json().catch(() => ({}))) as NextAuthSessionResponse;

  if (!sessionRes.ok || !sessionPayload.user?.id) {
    throw new AuthApiError(
      "Login succeeded, but protected API session is still unavailable. Please try again.",
    );
  }
}

export async function signup(params: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}) {
  const response = await post<AuthResponse>("/api/auth/signup", params);
  await persistAuthPayload(response);
  await persistLoginCredentials(params.email, params.password);
  await ensureNextAuthSession(params.email, params.password);
  void import("@/services/pushNotificationService").then(({ syncPushRegistration }) =>
    syncPushRegistration(),
  );
  return response;
}

export async function login(params: { email: string; password: string }) {
  const response = await post<AuthResponse>("/api/auth/login", params);
  await persistAuthPayload(response);
  await persistLoginCredentials(params.email, params.password);
  await ensureNextAuthSession(params.email, params.password);
  void import("@/services/pushNotificationService").then(({ syncPushRegistration }) =>
    syncPushRegistration(),
  );
  return response;
}

async function persistAuthPayload(payload: AuthResponse): Promise<void> {
  await AsyncStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(payload.user));

  if (payload.token) {
    await AsyncStorage.setItem(AUTH_TOKEN_STORAGE_KEY, payload.token);
  } else {
    await AsyncStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  }
}

async function persistLoginCredentials(email: string, password: string): Promise<void> {
  await AsyncStorage.setItem(
    AUTH_CREDENTIALS_STORAGE_KEY,
    JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
    }),
  );
}

export async function getStoredAuthUser(): Promise<AuthUser | null> {
  const raw = await AsyncStorage.getItem(AUTH_USER_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export async function refreshNextAuthSession(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(AUTH_CREDENTIALS_STORAGE_KEY);
  if (!raw) return false;

  try {
    const parsed = JSON.parse(raw) as { email?: string; password?: string };
    const email = parsed.email?.trim();
    const password = parsed.password;
    if (!email || !password) return false;

    await ensureNextAuthSession(email, password);
    return true;
  } catch {
    return false;
  }
}

async function clearNextAuthSession(): Promise<void> {
  try {
    const csrfRes = await fetch(`${API_BASE}/api/auth/csrf`, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    });

    const csrfPayload = (await csrfRes.json().catch(() => ({}))) as NextAuthCsrfResponse;
    const csrfToken = csrfPayload.csrfToken;
    if (!csrfToken) return;

    const body = new URLSearchParams();
    body.set("csrfToken", csrfToken);
    body.set("json", "true");

    await fetch(`${API_BASE}/api/auth/signout`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: body.toString(),
    });
  } catch {
    // Local logout should still proceed even if server signout fails.
  }
}

export async function logout(): Promise<void> {
  try {
    const { unregisterPushToken } = await import(
      "@/services/pushNotificationService"
    );
    await unregisterPushToken();
  } catch {
    // Logout should proceed even if push cleanup fails.
  }

  await clearNextAuthSession();
  await AsyncStorage.multiRemove([
    AUTH_USER_STORAGE_KEY,
    AUTH_TOKEN_STORAGE_KEY,
    AUTH_CREDENTIALS_STORAGE_KEY,
    "@asian_spices_profile_user",
    "@asian_spices_orders",
    "@asian_spices_recent_order_ids",
    "@asian_spices_cart",
  ]);
}
