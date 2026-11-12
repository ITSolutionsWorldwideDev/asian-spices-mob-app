import settingsJson from "@/features/profile/data/settings.json";
import type { SettingsData } from "@/features/profile/types/settings";

const data = settingsJson as SettingsData;

/** Replace with PostgreSQL/API fetch when backend is ready. */
export async function getSettingsData(): Promise<SettingsData> {
  return data;
}
