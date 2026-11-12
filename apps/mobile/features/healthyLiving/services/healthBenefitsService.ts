import healthBenefitsJson from "@/features/healthyLiving/data/healthBenefits.json";
import type { HealthBenefitsData } from "@/features/healthyLiving/types/healthBenefits";

const data = healthBenefitsJson as HealthBenefitsData;

/** Replace with PostgreSQL/API fetch when backend is ready. */
export async function getHealthBenefitsData(): Promise<HealthBenefitsData> {
  return data;
}
