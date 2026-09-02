import { getProductMeta } from "@/services/api/productMetaCache";
import { apiRequest } from "@/services/api/httpClient";
import type { CartItem } from "@/types/cart";

export type TaxRule = {
  id: string;
  tax_rate?: number | string | null;
  tax_name?: string | null;
  category_id?: string | number | null;
};

type TaxRulesResponse = {
  rules?: TaxRule[];
};

let cachedTaxRules: TaxRule[] = [];
let taxRulesLoadPromise: Promise<TaxRule[]> | null = null;

export function setCachedTaxRules(rules: TaxRule[]) {
  cachedTaxRules = rules;
}

export function getCachedTaxRules(): TaxRule[] {
  return cachedTaxRules;
}

function normalizeCategoryId(categoryId?: string | number | null) {
  if (categoryId == null || categoryId === "") return null;
  return String(categoryId);
}

function normalizeRate(rate: number | string | null | undefined) {
  const numeric =
    typeof rate === "number"
      ? rate
      : typeof rate === "string"
        ? Number(rate)
        : 0;

  if (!Number.isFinite(numeric) || numeric <= 0) return 0;
  if (numeric > 1) return numeric / 100;
  return numeric;
}

function resolveRuleForProduct(rules: TaxRule[], categoryId?: string | number | null) {
  const normalizedCategoryId = normalizeCategoryId(categoryId);

  if (normalizedCategoryId) {
    const categoryRule = rules.find(
      (rule) => normalizeCategoryId(rule.category_id) === normalizedCategoryId,
    );
    if (categoryRule) return categoryRule;
  }

  const genericRule = rules.find((rule) => normalizeCategoryId(rule.category_id) === null);
  if (genericRule) return genericRule;

  return null;
}

/** VAT rate from API rules only: category-specific, then platform default (null category_id). */
export function getVatRate(categoryId?: string | number | null): number {
  if (cachedTaxRules.length === 0) return 0;

  const rule = resolveRuleForProduct(cachedTaxRules, categoryId);
  return normalizeRate(rule?.tax_rate);
}

/** Display percentage for labels, e.g. 21 or 9. */
export function getVatRatePercent(categoryId?: string | number | null): number | null {
  const rate = getVatRate(categoryId);
  if (rate <= 0) return null;
  return Math.round(rate * 100);
}

export function getCartItemVatPercent(item: CartItem, rules: TaxRule[]): number | null {
  if (rules.length > 0) {
    cachedTaxRules = rules;
  }

  const meta = getProductMeta(item.id);
  return getVatRatePercent(meta?.categoryId);
}

/** Add VAT to an ex-VAT base price using category-specific API tax rules. */
export function applyVatToPrice(exclPrice: number, categoryId?: string | number | null): number {
  if (exclPrice <= 0) return 0;

  const rate = getVatRate(categoryId);
  if (rate <= 0) return exclPrice;

  return Number((exclPrice * (1 + rate)).toFixed(2));
}

/** Extract VAT portion from a gross (VAT-inclusive) price. */
export function extractVatFromGross(gross: number, categoryId?: string | number | null): number {
  if (gross <= 0) return 0;

  const rate = getVatRate(categoryId);
  if (rate <= 0) return 0;

  return Number((gross - gross / (1 + rate)).toFixed(2));
}

export async function fetchTaxRules(countryCode = "NL"): Promise<TaxRule[]> {
  try {
    const response = await apiRequest<TaxRulesResponse>(
      `/api/tax-rules?country_code=${encodeURIComponent(countryCode)}`,
    );
    return response.rules ?? [];
  } catch {
    return [];
  }
}

export function ensureTaxRulesLoaded(countryCode = "NL"): Promise<TaxRule[]> {
  if (cachedTaxRules.length > 0) {
    return Promise.resolve(cachedTaxRules);
  }

  if (!taxRulesLoadPromise) {
    taxRulesLoadPromise = fetchTaxRules(countryCode).then((rules) => {
      setCachedTaxRules(rules);
      return rules;
    });
  }

  return taxRulesLoadPromise;
}

export function getCartTaxTotal(items: CartItem[], rules: TaxRule[]) {
  if (items.length === 0) return 0;

  if (rules.length > 0) {
    cachedTaxRules = rules;
  }

  const totalTax = items.reduce((acc, item) => {
    const meta = getProductMeta(item.id);
    const lineGross = item.price * item.quantity;
    return acc + extractVatFromGross(lineGross, meta?.categoryId);
  }, 0);

  return Number(totalTax.toFixed(2));
}

export function getCartItemTax(item: CartItem, rules: TaxRule[]) {
  if (rules.length > 0) {
    cachedTaxRules = rules;
  }

  const meta = getProductMeta(item.id);
  const lineGross = item.price * item.quantity;
  return extractVatFromGross(lineGross, meta?.categoryId);
}

void ensureTaxRulesLoaded();
