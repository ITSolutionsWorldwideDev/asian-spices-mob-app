// lib/pricing.ts

import { CartItem } from "@/store/useCartStore";

export const FREE_SHIPPING_THRESHOLD = 50;
export const BASE_CURRENCY = "EUR";

export const SHIPPING_OPTIONS = {
  standard: { label: "Standard Shipping", price: 5.99 },
  express: { label: "Express Shipping", price: 12.99 },
  overnight: { label: "Overnight Shipping", price: 24.99 },
} as const;

export type ShippingMethod = keyof typeof SHIPPING_OPTIONS;

export function calculateTotals(
  cart: CartItem[],
  shippingCost: number,
  taxRules: any[],
  shippingCodeOrName?: string,
) {
  let totalCalculatedTax = 0;

  // 1️⃣ Find Global Rule fallback if any (where category_id is null)
  const globalRule = taxRules.find((r) => r.category_id === null);
  const globalRate = globalRule ? parseFloat(globalRule.tax_rate) / 100 : 0.21;

  const subtotal = cart.reduce((acc, item) => {
    const base_price = Number(item.base_price || 0);
    const quantity = Number(item.quantity || 1);
    const itemGrossTotal = base_price * quantity;

    // 2️⃣ Find item category specific rule match
    // Make sure your item schema includes 'category_id'
    const matchingRule = taxRules.find(
      (r) => r.category_id === item.category_id,
    );
    const activeRate = matchingRule
      ? parseFloat(matchingRule.tax_rate) / 100
      : globalRate;

    // 3️⃣ Extract embedded tax amount from the gross price: Gross - (Gross / (1 + Rate))
    const extractedTaxAmount =
      itemGrossTotal - itemGrossTotal / (1 + activeRate);
    totalCalculatedTax += extractedTaxAmount;

    return acc + itemGrossTotal;
  }, 0);

  const isStandardMethod =
    shippingCodeOrName?.toLowerCase() === "standard" ||
    shippingCodeOrName?.toLowerCase() === "standard delivery";

  const shipping =
    subtotal >= FREE_SHIPPING_THRESHOLD && isStandardMethod ? 0 : shippingCost;

  // Gross Total remains subtotal + shipping since prices already contain tax
  const total = subtotal + shipping;

  return { subtotal, tax: totalCalculatedTax, shipping, total };
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

/* 
import { CartItem } from "@/store/useCartStore";

// export const TAX_RATE = 0.21;
export const FREE_SHIPPING_THRESHOLD = 50;
export const BASE_CURRENCY = "EUR";

export const SHIPPING_OPTIONS = {
  standard: { label: "Standard Shipping", price: 5.99 },
  express: { label: "Express Shipping", price: 12.99 },
  overnight: { label: "Overnight Shipping", price: 24.99 },
} as const;

export type ShippingMethod = keyof typeof SHIPPING_OPTIONS;

export function calculateTotals(
  cart: CartItem[],
  shippingCost: number,
  taxRate: number,
  shippingCodeOrName?: string,
) {
  const subtotal = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );

  // const tax = subtotal * TAX_RATE;
  const tax = subtotal * taxRate;
  const isStandardMethod =
    shippingCodeOrName?.toLowerCase() === "standard" ||
    shippingCodeOrName?.toLowerCase() === "standard delivery";

  const shipping =
    subtotal >= FREE_SHIPPING_THRESHOLD && isStandardMethod ? 0 : shippingCost;

  
  // const total = subtotal + tax + shipping;
  const total = subtotal + shipping;

  return { subtotal, tax, shipping, total };
}

export function convertPrice(
  amount: number,
  rate: number,
  currency: string,
  baseCurrency: string = BASE_CURRENCY,
) {
  if (!amount) return 0;

  if (!currency || currency === baseCurrency) {
    return amount;
  }

  const safeRate = rate <= 0 ? 1 : rate;
  return amount * safeRate;

  // return amount * rate;
}

export function safeNumber(value: any): number {
  const n = Number(value);
  return isNaN(n) ? 0 : n;
}

export function convertTotals(
  totals: {
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
  },
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
} */
