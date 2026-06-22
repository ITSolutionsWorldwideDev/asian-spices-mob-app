import checkoutJson from "@/data/checkout.json";
import type { CheckoutData } from "@/types/checkout";

const data = checkoutJson as CheckoutData;

/** Replace with PostgreSQL/API fetch when backend is ready. */
export async function getCheckoutData(): Promise<CheckoutData> {
  return data;
}
