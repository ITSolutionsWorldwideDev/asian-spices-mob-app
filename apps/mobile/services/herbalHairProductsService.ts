import catalogJson from "@/data/herbalHairProducts.json";
import type { HealthyLivingCatalogData } from "@/types/healthyLivingCatalog";

const data = catalogJson as unknown as HealthyLivingCatalogData;

/** Replace with PostgreSQL/API fetch when backend is ready. */
export async function getHerbalHairProductsData(): Promise<HealthyLivingCatalogData> {
  return data;
}
