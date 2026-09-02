import {
  addNotificationResponseListener,
  getNotificationData,
  syncPushRegistration,
} from "@/services/pushNotificationService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";

const HANDLED_NOTIFICATION_KEY = "@asian_spices_handled_notification_id";
/** Only treat a cold-start response as a tap if it is this recent (ms). */
const COLD_START_WINDOW_MS = 30_000;

function navigateFromNotificationData(
  router: ReturnType<typeof useRouter>,
  data: Record<string, unknown>,
) {
  const orderId = data.orderId;
  if (typeof orderId === "string" && orderId.length > 0) {
    router.push({ pathname: "/track-order/[id]", params: { id: orderId } });
    return;
  }

  router.push("/notifications");
}

function getNotificationRequestId(response: Notifications.NotificationResponse) {
  return response.notification.request.identifier;
}

function isRecentColdStartResponse(response: Notifications.NotificationResponse) {
  const receivedAt = response.notification.date;
  if (typeof receivedAt !== "number" || !Number.isFinite(receivedAt)) {
    return true;
  }

  return Date.now() - receivedAt <= COLD_START_WINDOW_MS;
}

async function wasNotificationAlreadyHandled(requestId: string) {
  const handledId = await AsyncStorage.getItem(HANDLED_NOTIFICATION_KEY);
  return handledId === requestId;
}

async function handleNotificationResponse(
  router: ReturnType<typeof useRouter>,
  response: Notifications.NotificationResponse,
  options: { requireRecent?: boolean } = {},
) {
  const requestId = getNotificationRequestId(response);
  if (!requestId) {
    return false;
  }

  if (options.requireRecent && !isRecentColdStartResponse(response)) {
    await Notifications.clearLastNotificationResponseAsync();
    return false;
  }

  if (await wasNotificationAlreadyHandled(requestId)) {
    await Notifications.clearLastNotificationResponseAsync();
    return false;
  }

  await AsyncStorage.setItem(HANDLED_NOTIFICATION_KEY, requestId);
  await Notifications.clearLastNotificationResponseAsync();

  const data = getNotificationData(response.notification);
  navigateFromNotificationData(router, data);
  return true;
}

/**
 * Registers Expo push tokens when logged in with push enabled,
 * and deep-links taps on push notifications into the app.
 */
export default function PushNotificationsBootstrap() {
  const router = useRouter();
  const handledInitial = useRef(false);

  useEffect(() => {
    void syncPushRegistration();

    const subscription = addNotificationResponseListener((response) => {
      void handleNotificationResponse(router, response);
    });

    // Cold start: only navigate when the app was opened by tapping a notification.
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response || handledInitial.current) {
        return;
      }

      handledInitial.current = true;
      void handleNotificationResponse(router, response, { requireRecent: true });
    });

    return () => {
      subscription.remove();
    };
  }, [router]);

  return null;
}
