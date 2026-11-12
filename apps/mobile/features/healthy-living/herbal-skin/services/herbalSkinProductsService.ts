import catalogJson from "@/features/healthy-living/herbal-skin/data/herbalSkinProducts.json";
import type { HealthyLivingCatalogData } from "@/features/healthy-living/types/healthyLivingCatalog";

const data = catalogJson as unknown as HealthyLivingCatalogData;

/** Replace with PostgreSQL/API fetch when backend is ready. */
export async function getHerbalSkinProductsData(): Promise<HealthyLivingCatalogData> {
  return data;
}
