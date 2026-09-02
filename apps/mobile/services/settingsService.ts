import settingsJson from "@/data/settings.json";
import type { SettingsData } from "@/types/settings";

const data = settingsJson as SettingsData;

/** Replace with PostgreSQL/API fetch when backend is ready. */
export async function getSettingsData(): Promise<SettingsData> {
  return data;
}
