import { applyVatToPrice } from "@/services/taxService";

export type DbProductPricingFields = {
  base_price?: string | number | null;
  sale_price?: string | number | null;
  discount_type?: string | null;
  discount_value?: string | number | null;
  category_id?: string | null;
};

export type ResolvedProductPricing = {
  price: number;
  originalPrice?: number;
  discount?: number;
  discountType?: "percentage" | "fixed";
  discountPercent?: number;
};

function toNumber(value: string | number | null | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeDiscountType(type?: string | null): "percentage" | "fixed" | null {
  const normalized = type?.trim().toLowerCase();
  if (normalized === "percentage" || normalized === "percent") return "percentage";
  if (normalized === "fixed" || normalized === "amount" || normalized === "fixed_amount") {
    return "fixed";
  }
  return null;
}

function withVat(
  pricing: ResolvedProductPricing,
  categoryId?: string | null,
): ResolvedProductPricing {
  return {
    ...pricing,
    price: applyVatToPrice(pricing.price, categoryId),
    originalPrice:
      pricing.originalPrice != null
        ? applyVatToPrice(pricing.originalPrice, categoryId)
        : undefined,
  };
}

/** Resolve display price from DB fields, then add category-specific VAT from API tax rules. */
export function resolveProductPricing(item: DbProductPricingFields): ResolvedProductPricing {
  const basePrice = toNumber(item.base_price) ?? 0;
  const salePrice = toNumber(item.sale_price);
  const hasSale = salePrice !== null && salePrice < basePrice;
  const discountType = normalizeDiscountType(item.discount_type);
  const discountValue = toNumber(item.discount_value) ?? 0;

  if (discountType === "percentage" && discountValue > 0) {
    const price = hasSale
      ? (salePrice as number)
      : Math.max(0, basePrice - (basePrice * discountValue) / 100);
    return withVat(
      {
        discountType: "percentage",
        discount: Math.round(discountValue),
        discountPercent: Math.round(discountValue),
        price,
        originalPrice: basePrice > price ? basePrice : undefined,
      },
      item.category_id,
    );
  }

  if (discountType === "fixed" && discountValue > 0) {
    const price = hasSale ? (salePrice as number) : Math.max(0, basePrice - discountValue);
    return withVat(
      {
        discountType: "fixed",
        discount: discountValue,
        price,
        originalPrice: basePrice > price ? basePrice : undefined,
      },
      item.category_id,
    );
  }

  if (hasSale && basePrice > 0) {
    const percent = Math.round(((basePrice - (salePrice as number)) / basePrice) * 100);
    return withVat(
      {
        discountType: "percentage",
        discount: percent,
        discountPercent: percent,
        price: salePrice as number,
        originalPrice: basePrice,
      },
      item.category_id,
    );
  }

  return withVat(
    {
      price: basePrice,
      originalPrice: undefined,
      discount: undefined,
      discountType: undefined,
      discountPercent: undefined,
    },
    item.category_id,
  );
}
