import preferencesJson from "@/data/notificationPreferences.json";
import { refreshNextAuthSession } from "@/services/api/authService";
import { ApiRequestError, apiRequest } from "@/services/api/httpClient";
import type { NotificationPreferences } from "@/types/notificationPreferences";
import AsyncStorage from "@react-native-async-storage/async-storage";

const NOTIFICATION_PREFERENCES_STORAGE_KEY =
  "@asian_spices_notification_preferences";
const defaults = preferencesJson as NotificationPreferences;

type PreferencesResponse = {
  preferences?: NotificationPreferences;
  success?: boolean;
  error?: string;
};

async function apiRequestWithSessionRetry<T>(
  path: string,
  options?: Omit<RequestInit, "body"> & { body?: unknown },
): Promise<T> {
  try {
    return await apiRequest<T>(path, options);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) {
      const refreshed = await refreshNextAuthSession();
      if (refreshed) {
        return apiRequest<T>(path, options);
      }
    }
    throw error;
  }
}

function normalizePreferences(
  value: Partial<NotificationPreferences> | null | undefined,
): NotificationPreferences {
  return {
    ...defaults,
    ...(value ?? {}),
  };
}

async function cachePreferences(preferences: NotificationPreferences) {
  await AsyncStorage.setItem(
    NOTIFICATION_PREFERENCES_STORAGE_KEY,
    JSON.stringify(preferences),
  );
}

async function readCachedPreferences(): Promise<NotificationPreferences | null> {
  const stored = await AsyncStorage.getItem(NOTIFICATION_PREFERENCES_STORAGE_KEY);
  if (!stored) return null;
  try {
    return normalizePreferences(JSON.parse(stored) as NotificationPreferences);
  } catch {
    return null;
  }
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const payload = await apiRequestWithSessionRetry<PreferencesResponse>(
      "/api/account/notification-preferences",
    );
    const preferences = normalizePreferences(payload.preferences);
    await cachePreferences(preferences);
    return preferences;
  } catch (error) {
    const cached = await readCachedPreferences();
    if (cached) return cached;

    // Unauthenticated / offline: fall back to defaults (or local cache above).
    if (error instanceof ApiRequestError && error.status === 401) {
      return { ...defaults };
    }

    console.error("Failed to load notification preferences from API", error);
    return { ...defaults };
  }
}

export async function saveNotificationPreferences(
  preferences: NotificationPreferences,
): Promise<NotificationPreferences> {
  const payload = await apiRequestWithSessionRetry<PreferencesResponse>(
    "/api/account/notification-preferences",
    {
      method: "PUT",
      body: preferences,
    },
  );

  const saved = normalizePreferences(payload.preferences ?? preferences);
  await cachePreferences(saved);
  return saved;
}

export async function updateNotificationPreference(
  key: keyof NotificationPreferences,
  value: boolean,
): Promise<NotificationPreferences> {
  const current = await getNotificationPreferences();
  const next = { ...current, [key]: value };

  if (key === "pushEnabled" && !value) {
    next.orderUpdates = false;
    next.recipeReelUpdates = false;
    next.newProducts = false;
    next.priceDrops = false;
    next.restockAlerts = false;
  }

  try {
    const saved = await saveNotificationPreferences(next);

    if (key === "pushEnabled") {
      const {
        registerForPushNotificationsAsync,
        unregisterPushToken,
      } = await import("@/services/pushNotificationService");

      if (value) {
        const token = await registerForPushNotificationsAsync();
        if (!token) {
          // Permission denied or simulator — keep prefs but warn via null.
          console.warn("Push permission not granted; preference saved without device token.");
        }
      } else {
        await unregisterPushToken();
      }
    }

    return saved;
  } catch (error) {
    // Keep UX snappy offline: persist locally if API save fails.
    console.error("Failed to save notification preferences to API", error);
    await cachePreferences(next);
    if (error instanceof ApiRequestError && error.status === 401) {
      throw new ApiRequestError("Please login to save notification preferences", 401);
    }
    throw error;
  }
}
