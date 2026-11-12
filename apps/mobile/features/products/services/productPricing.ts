import { getVatRate } from "@/features/cart/services/taxService";

export type DbProductPricingFields = {
  base_price?: string | number | null;
  sale_price?: string | number | null;
  min_offered_price?: string | number | null;
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

/** Match web ProductCard / ProductDesc: percentage | Bulk | percent → percentage. */
function normalizeDiscountType(type?: string | null): "percentage" | "fixed" | null {
  const normalized = type?.trim().toLowerCase();
  if (
    normalized === "percentage" ||
    normalized === "percent" ||
    normalized === "bulk"
  ) {
    return "percentage";
  }
  if (
    normalized === "fixed" ||
    normalized === "amount" ||
    normalized === "fixed_amount" ||
    normalized === "flat"
  ) {
    return "fixed";
  }
  return null;
}

/**
 * Resolve display/cart unit price the same way as asian-spices-web:
 * - With discount meta: VAT catalog `base_price` first, then apply % / fixed
 * - Without discount meta: payable net = min_offered || sale (if sale < base) || base, then VAT
 */
export function resolveProductPricing(item: DbProductPricingFields): ResolvedProductPricing {
  const basePrice = toNumber(item.base_price) ?? 0;
  const salePrice = toNumber(item.sale_price);
  const offeredPrice = toNumber(item.min_offered_price);
  const discountType = normalizeDiscountType(item.discount_type);
  const discountValue = toNumber(item.discount_value) ?? 0;
  const hasDiscountMeta = discountType != null && discountValue > 0;
  const hasCatalogSale =
    salePrice !== null && basePrice > 0 && salePrice < basePrice;

  // category → global → 21% after tax rules load; 0 while loading (no temporary flash)
  const taxRate = getVatRate(item.category_id);

  // Net payable before VAT when discount meta does not override (ProductDesc / ProductCard)
  let netPrice = basePrice;
  let netOriginal: number | undefined;

  if (offeredPrice !== null) {
    if (hasCatalogSale) {
      netPrice = Math.min(offeredPrice, salePrice as number);
      netOriginal = basePrice > netPrice ? basePrice : undefined;
    } else {
      netPrice = offeredPrice;
      if (basePrice > netPrice) netOriginal = basePrice;
    }
  } else if (hasCatalogSale) {
    netPrice = salePrice as number;
    netOriginal = basePrice;
  }

  // Discount meta overrides sale / country offer: VAT base first, then % / fixed
  if (
    taxRate > 0 &&
    hasDiscountMeta &&
    basePrice > 0 &&
    (discountType === "fixed" ||
      (discountType === "percentage" && discountValue < 100))
  ) {
    const baseWithTax = Number((basePrice * (1 + taxRate)).toFixed(2));
    const price =
      discountType === "fixed"
        ? Number(Math.max(0, baseWithTax - discountValue).toFixed(2))
        : Number((baseWithTax * (1 - discountValue / 100)).toFixed(2));

    const percent =
      discountType === "percentage"
        ? Math.round(discountValue)
        : baseWithTax > 0
          ? Math.round(((baseWithTax - price) / baseWithTax) * 100)
          : undefined;

    return {
      price,
      originalPrice: baseWithTax > price ? baseWithTax : undefined,
      discountType,
      discount: discountType === "percentage" ? Math.round(discountValue) : discountValue,
      discountPercent: percent,
    };
  }

  // No discount-meta override: VAT the net payable (and list price if marked down)
  if (taxRate > 0 && netPrice > 0) {
    const price = Number((netPrice * (1 + taxRate)).toFixed(2));
    const originalPrice =
      netOriginal != null && netOriginal > netPrice
        ? Number((netOriginal * (1 + taxRate)).toFixed(2))
        : undefined;
    const percent =
      originalPrice != null && originalPrice > 0
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : undefined;

    return {
      price,
      originalPrice,
      discountType: percent != null && percent > 0 ? "percentage" : undefined,
      discount: percent,
      discountPercent: percent,
    };
  }

  // Tax rules not loaded yet — return net (lists refresh after rules hydrate)
  return {
    price: netPrice,
    originalPrice:
      netOriginal != null && netOriginal > netPrice ? netOriginal : undefined,
    discount: undefined,
    discountType: undefined,
    discountPercent: undefined,
  };
}
