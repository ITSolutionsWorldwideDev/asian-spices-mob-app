import { getStoredAuthUser, refreshNextAuthSession } from "@/features/auth/services/authService";
import { ApiRequestError, apiRequest } from "@/shared/services/api/httpClient";
import { getNotificationPreferences } from "@/features/profile/services/notificationPreferencesService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const PUSH_TOKEN_STORAGE_KEY = "@asian_spices_expo_push_token";

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

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

function getEasProjectId() {
  return (
    Constants.easConfig?.projectId ??
    Constants.expoConfig?.extra?.eas?.projectId ??
    null
  );
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Push is not supported on web / simulators without proper setup.
  if (Platform.OS === "web") return null;
  if (!Device.isDevice) {
    console.warn("Push notifications require a physical device.");
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF9800",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  const projectId = getEasProjectId();
  if (!projectId) {
    console.warn("Missing EAS projectId for Expo push token.");
    return null;
  }

  const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
  const token = tokenResponse.data;

  await apiRequestWithSessionRetry("/api/account/push-tokens", {
    method: "POST",
    body: {
      token,
      platform:
        Platform.OS === "ios" || Platform.OS === "android"
          ? Platform.OS
          : "unknown",
    },
  });

  await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
  return token;
}

export async function getStoredPushToken(): Promise<string | null> {
  return AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
}

export async function unregisterPushToken(token?: string | null): Promise<void> {
  try {
    const stored =
      token ?? (await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY));

    if (stored) {
      await apiRequestWithSessionRetry("/api/account/push-tokens", {
        method: "DELETE",
        body: { token: stored },
      });
    } else {
      await apiRequestWithSessionRetry("/api/account/push-tokens", {
        method: "DELETE",
        body: { all: true },
      });
    }
  } catch (error) {
    console.error("Failed to unregister push token", error);
  } finally {
    await AsyncStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
  }
}

/**
 * Registers or clears the device token based on auth + push preference.
 * Safe to call on app launch and after preference changes.
 */
export async function syncPushRegistration(): Promise<void> {
  try {
    const authUser = await getStoredAuthUser();
    if (!authUser) return;

    const prefs = await getNotificationPreferences();
    if (!prefs.pushEnabled) {
      await unregisterPushToken();
      return;
    }

    await registerForPushNotificationsAsync();
  } catch (error) {
    console.error("Failed to sync push registration", error);
  }
}

export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void,
) {
  if (Platform.OS === "web") {
    return { remove: () => {} };
  }
  return Notifications.addNotificationResponseReceivedListener(handler);
}

export function addNotificationReceivedListener(
  handler: (notification: Notifications.Notification) => void,
) {
  if (Platform.OS === "web") {
    return { remove: () => {} };
  }
  return Notifications.addNotificationReceivedListener(handler);
}

export function getNotificationData(
  notification: Notifications.Notification,
): Record<string, unknown> {
  const data = notification.request.content.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }
  return {};
}
