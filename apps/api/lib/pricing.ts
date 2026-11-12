// lib/pricing.ts — aligned with asian-spices-web/lib/commerce/pricing.ts

import { CartItem } from "@/store/useCartStore";

export const FREE_SHIPPING_THRESHOLD = 50;
export const MIN_ORDER_AMOUNT_EUR = 10;
export const BASE_CURRENCY = "EUR";

export interface LineItemFinancials {
  id: string;
  gross_subtotal: number;
  tax_rate: number;
  tax_amount: number;
}

export const SHIPPING_OPTIONS = {
  standard: { label: "Standard Shipping", price: 5.99 },
  express: { label: "Express Shipping", price: 12.99 },
  overnight: { label: "Overnight Shipping", price: 24.99 },
} as const;

export type ShippingMethod = keyof typeof SHIPPING_OPTIONS;

/** Match web `resolveTaxRate`: category → global → 21% (0 while not loaded). */
export function resolveTaxRate(
  taxRules: { category_id: string | null; tax_rate: string | number }[],
  categoryId?: string | null,
  options?: { loaded?: boolean },
): number {
  if (options?.loaded === false) return 0;

  const matching = taxRules.find(
    (r) =>
      r.category_id != null &&
      categoryId &&
      String(r.category_id) === String(categoryId),
  );
  if (matching) {
    const rate = parseFloat(String(matching.tax_rate));
    if (Number.isFinite(rate)) return rate > 1 ? rate / 100 : rate;
  }

  const global = taxRules.find((r) => r.category_id === null);
  if (global) {
    const rate = parseFloat(String(global.tax_rate));
    if (Number.isFinite(rate)) return rate > 1 ? rate / 100 : rate;
  }

  return 0.21;
}

export function calculateTotals(
  cart: CartItem[],
  shippingCost: number,
  taxRules: any[],
  shippingCodeOrName?: string,
  taxReady: boolean = true,
) {
  let totalCalculatedTax = 0;
  const lineItemFinancials: LineItemFinancials[] = [];

  const subtotal = cart.reduce((acc, item) => {
    const base_price = Number(item.base_price || 0);
    const quantity = Number(item.quantity || 1);
    const itemGrossTotal = base_price * quantity;

    const activeRate = resolveTaxRate(taxRules, item.category_id, {
      loaded: taxReady,
    });

    const extractedTaxAmount =
      itemGrossTotal - itemGrossTotal / (1 + activeRate);

    totalCalculatedTax += extractedTaxAmount;

    lineItemFinancials.push({
      id: item.id,
      gross_subtotal: itemGrossTotal,
      tax_rate: activeRate,
      tax_amount: extractedTaxAmount,
    });

    return acc + itemGrossTotal;
  }, 0);

  const label = (shippingCodeOrName || "").toLowerCase();
  const isStandardMethod =
    label === "standard" ||
    label === "standard delivery" ||
    label === "standard shipping" ||
    label.includes("standard");

  const shipping =
    subtotal >= FREE_SHIPPING_THRESHOLD && isStandardMethod ? 0 : shippingCost;

  // Gross total = subtotal + shipping (prices already contain tax)
  const total = subtotal + shipping;

  return {
    subtotal,
    tax: totalCalculatedTax,
    shipping,
    total,
    lineItems: lineItemFinancials,
  };
}

export function applyDiscount(
  totals: { subtotal: number; tax: number; shipping: number; total: number },
  discount: number,
) {
  const cappedDiscount = Math.max(0, Math.min(discount || 0, totals.subtotal));
  const subtotal = Math.max(0, totals.subtotal - cappedDiscount);
  const total = subtotal + totals.shipping;

  return { ...totals, subtotal, discount: cappedDiscount, total };
}

export function convertPrice(
  amount: number,
  rate: number,
  currency: string,
  baseCurrency: string = BASE_CURRENCY,
) {
  if (!amount) return 0;
  if (!currency || currency === baseCurrency) return amount;
  return amount * (rate <= 0 ? 1 : rate);
}

export function convertTotals(
  totals: { subtotal: number; tax: number; shipping: number; total: number },
  rate: number,
  currency: string,
  baseCurrency: string = BASE_CURRENCY,
) {
  return {
    subtotal: convertPrice(totals.subtotal, rate, currency, baseCurrency),
    tax: convertPrice(totals.tax, rate, currency, baseCurrency),
    shipping: convertPrice(totals.shipping, rate, currency, baseCurrency),
    total: convertPrice(totals.total, rate, currency, baseCurrency),
  };
}

export type RecipeLikeDiscountInput = {
  discount_type: string;
  discount_value: number;
};

export function calculateRecipeLikeDiscountAmount(
  subtotal: number,
  discount: RecipeLikeDiscountInput,
  currencyRate = 1,
) {
  const value = Number(discount.discount_value);

  if (!Number.isFinite(value) || value <= 0 || subtotal <= 0) {
    return 0;
  }

  const type = (discount.discount_type || "").toUpperCase();

  if (type === "PERCENT" || type === "PERCENTAGE") {
    return Math.min(subtotal, subtotal * (value / 100));
  }

  const flatAmount = value * (currencyRate || 1);
  return Math.min(subtotal, flatAmount);
}
