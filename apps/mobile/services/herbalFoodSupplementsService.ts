import supplementsJson from "@/data/herbalFoodSupplements.json";
import type { HerbalFoodSupplementsData } from "@/types/herbalFoodSupplements";

const data = supplementsJson as HerbalFoodSupplementsData;

/** Replace with PostgreSQL/API fetch when backend is ready. */
export async function getHerbalFoodSupplementsData(): Promise<HerbalFoodSupplementsData> {
  return data;
}
