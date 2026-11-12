import supplementsJson from "@/features/healthyLiving/data/herbalFoodSupplements.json";
import type { HerbalFoodSupplementsData } from "@/features/healthyLiving/types/herbalFoodSupplements";

const data = supplementsJson as HerbalFoodSupplementsData;

/** Replace with PostgreSQL/API fetch when backend is ready. */
export async function getHerbalFoodSupplementsData(): Promise<HerbalFoodSupplementsData> {
  return data;
}
