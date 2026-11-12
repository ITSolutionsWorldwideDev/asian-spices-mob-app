import Constants from "expo-constants";
import { Platform } from "react-native";

const DEFAULT_API_BASE = "http://localhost:3000";

function normalizeBase(url: string) {
  return url.replace(/\/$/, "");
}

function readExpoHost() {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) {
    return null;
  }

  const [host] = hostUri.split(":");
  return host || null;
}

function swapHostname(url: string, host: string) {
  try {
    const parsed = new URL(url);
    parsed.hostname = host;
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return normalizeBase(url);
  }
}

export function resolveApiBase() {
  const configured = process.env.EXPO_PUBLIC_NEXT_API_URL?.trim();
  const expoHost = readExpoHost();

  if (configured) {
    const normalized = normalizeBase(configured);

    if (
      Platform.OS !== "web" &&
      expoHost &&
      /:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(normalized)
    ) {
      return swapHostname(normalized, expoHost);
    }

    return normalized;
  }

  if (Platform.OS !== "web" && expoHost) {
    return `http://${expoHost}:3000`;
  }

  return DEFAULT_API_BASE;
}

export const API_BASE = resolveApiBase();
