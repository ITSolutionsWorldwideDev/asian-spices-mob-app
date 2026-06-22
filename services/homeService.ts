import homeJson from "@/data/home.json";
import type { HomeData } from "@/types/home";

/**
 * Swap this implementation with a PostgreSQL/API fetch later.
 * Example: return fetch(`${API_URL}/home`).then(r => r.json())
 */
export async function getHomeData(): Promise<HomeData> {
  return homeJson as HomeData;
}
