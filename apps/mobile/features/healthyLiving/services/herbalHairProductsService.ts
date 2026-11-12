import catalogJson from "@/features/healthyLiving/data/herbalHairProducts.json";
import type { HealthyLivingCatalogData } from "@/features/healthyLiving/types/healthyLivingCatalog";

const data = catalogJson as unknown as HealthyLivingCatalogData;

/** Replace with PostgreSQL/API fetch when backend is ready. */
export async function getHerbalHairProductsData(): Promise<HealthyLivingCatalogData> {
  return data;
}
