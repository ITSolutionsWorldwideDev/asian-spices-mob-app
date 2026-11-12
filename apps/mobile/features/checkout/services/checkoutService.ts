import checkoutJson from "@/features/checkout/data/checkout.json";
import { apiRequest } from "@/shared/services/api/httpClient";
import type {
  AppliedPromo,
  AppliedRecipeDiscount,
  CheckoutData,
  RecipeDiscountOption,
  ShippingOption,
} from "@/features/checkout/types/checkout";

const data = checkoutJson as CheckoutData;

/** Replace with PostgreSQL/API fetch when backend is ready. */
export async function getCheckoutData(): Promise<CheckoutData> {
  return data;
}

type ShippingOptionsResponse = {
  success?: boolean;
  options?: Array<{
    id?: string;
    name?: string;
    code?: string;
    price?: number | string | null;
    minDays?: number | null;
    maxDays?: number | null;
    min_delivery_days?: number | null;
    max_delivery_days?: number | null;
  }>;
};

function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return 0;
}

function normalizeCountryForShipping(country: string) {
  const trimmed = country.trim();
  if (!trimmed) return "";

  const normalized = trimmed.toLowerCase();
  const lookup: Record<string, string> = {
    nl: "NL",
    netherlands: "NL",
    "the netherlands": "NL",
    netherland: "NL",
    holland: "NL",
  };

  if (lookup[normalized]) {
    return lookup[normalized];
  }

  if (/^[a-z]{2}$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  return trimmed.toUpperCase();
}

export async function fetchShippingOptions(params: {
  country: string;
  city: string;
  weight?: number;
}): Promise<ShippingOption[]> {
  const country = normalizeCountryForShipping(params.country);
  const city = params.city.trim();
  const weight = Number.isFinite(params.weight) ? Number(params.weight) : 0;

  if (!country || !city) return [];

  const query = new URLSearchParams({
    country,
    city,
    weight: String(weight),
  });

  const response = await apiRequest<ShippingOptionsResponse>(
    `/api/checkout/shipping-options?${query.toString()}`
  );

  return (response.options ?? [])
    .map((option, index) => {
      const price = toNumber(option.price);
      return {
        id: String(option.id ?? option.code ?? `shipping-${index}`),
        name: option.name?.trim() || "Shipping",
        code: option.code?.trim() || undefined,
        price: Number.isFinite(price) ? price : 0,
        minDays: option.minDays ?? option.min_delivery_days ?? null,
        maxDays: option.maxDays ?? option.max_delivery_days ?? null,
      } satisfies ShippingOption;
    })
    .filter((option) => Number.isFinite(option.price));
}

type PromoResponse = {
  valid?: boolean;
  success?: boolean;
  code?: string;
  discount?: number;
  discount_amount?: number;
  discount_type?: string;
  discount_value?: number;
  error?: string;
};

/** Apply promo using the same EUR-subtotal rules as asian-spices-web checkout. */
export async function applyPromoCode(code: string, subtotal: number): Promise<AppliedPromo> {
  const response = await apiRequest<PromoResponse>("/api/checkout/promo", {
    method: "POST",
    body: { code, subtotal },
  });

  const discountAmount =
    response.discount_amount ?? response.discount ?? null;

  if ((!response.valid && !response.success) || discountAmount == null) {
    throw new Error(response.error || "Invalid or inapplicable promo code.");
  }

  return {
    code: response.code || code.trim(),
    discount: discountAmount,
  };
}

type RecipeDiscountsResponse = {
  success?: boolean;
  discounts?: RecipeDiscountOption[];
};

type RecipeDiscountApplyResponse = {
  success?: boolean;
  id?: string;
  label?: string;
  discount?: number;
  error?: string;
};

export async function fetchRecipeDiscounts(): Promise<RecipeDiscountOption[]> {
  const response = await apiRequest<RecipeDiscountsResponse>("/api/checkout/recipe-discounts");
  return response.discounts ?? [];
}

export async function applyRecipeDiscount(
  discountId: string,
  subtotal: number,
): Promise<AppliedRecipeDiscount> {
  const response = await apiRequest<RecipeDiscountApplyResponse>("/api/checkout/recipe-discount", {
    method: "POST",
    body: { discountId, subtotal },
  });

  if (!response.success || response.discount == null || !response.id) {
    throw new Error(response.error || "Recipe discount unavailable.");
  }

  return {
    id: response.id,
    label: response.label || "Recipe discount",
    discount: response.discount,
  };
}
