import preferencesJson from "@/data/notificationPreferences.json";
import type { NotificationPreferences } from "@/types/notificationPreferences";
import AsyncStorage from "@react-native-async-storage/async-storage";

const NOTIFICATION_PREFERENCES_STORAGE_KEY = "@asian_spices_notification_preferences";
const defaults = preferencesJson as NotificationPreferences;

/** Replace with PostgreSQL/API fetch when backend is ready. */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const stored = await AsyncStorage.getItem(NOTIFICATION_PREFERENCES_STORAGE_KEY);
  if (!stored) return { ...defaults };
  return { ...defaults, ...(JSON.parse(stored) as NotificationPreferences) };
}

export async function saveNotificationPreferences(
  preferences: NotificationPreferences
): Promise<void> {
  await AsyncStorage.setItem(
    NOTIFICATION_PREFERENCES_STORAGE_KEY,
    JSON.stringify(preferences)
  );
}

export async function updateNotificationPreference(
  key: keyof NotificationPreferences,
  value: boolean
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

  await saveNotificationPreferences(next);
  return next;
}
