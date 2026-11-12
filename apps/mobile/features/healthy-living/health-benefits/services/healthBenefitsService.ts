import healthBenefitsJson from "@/features/healthy-living/health-benefits/data/healthBenefits.json";
import type { HealthBenefitsData } from "@/features/healthy-living/health-benefits/types/healthBenefits";

const data = healthBenefitsJson as HealthBenefitsData;

/** Replace with PostgreSQL/API fetch when backend is ready. */
export async function getHealthBenefitsData(): Promise<HealthBenefitsData> {
  return data;
}
