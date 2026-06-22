import notificationsJson from "@/data/notifications.json";
import type { AppNotification, NotificationsData } from "@/types/notification";
import AsyncStorage from "@react-native-async-storage/async-storage";

const NOTIFICATIONS_STORAGE_KEY = "@asian_spices_notifications_read";
const data = notificationsJson as NotificationsData;

async function getReadIds(): Promise<Set<string>> {
  const stored = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
  if (!stored) return new Set();
  return new Set(JSON.parse(stored) as string[]);
}

async function saveReadIds(ids: Set<string>): Promise<void> {
  await AsyncStorage.setItem(
    NOTIFICATIONS_STORAGE_KEY,
    JSON.stringify(Array.from(ids))
  );
}

function mergeReadState(
  notifications: AppNotification[],
  readIds: Set<string>
): AppNotification[] {
  return notifications.map((item) => ({
    ...item,
    isRead: readIds.has(item.id) || item.isRead,
  }));
}

/** Replace with PostgreSQL/API fetch when backend is ready. */
export async function getNotifications(): Promise<AppNotification[]> {
  const readIds = await getReadIds();
  return mergeReadState(data.notifications, readIds);
}

export async function getUnreadCount(): Promise<number> {
  const notifications = await getNotifications();
  return notifications.filter((item) => !item.isRead).length;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const readIds = await getReadIds();
  readIds.add(id);
  await saveReadIds(readIds);
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const ids = data.notifications.map((item) => item.id);
  await saveReadIds(new Set(ids));
}
