import { getProductMeta } from "@/shared/services/api/productMetaCache";
import { apiRequest } from "@/shared/services/api/httpClient";
import type { CartItem } from "@/features/cart/types/cart";

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
let taxRulesLoaded = false;
let taxRulesLoadPromise: Promise<TaxRule[]> | null = null;

export function setCachedTaxRules(rules: TaxRule[]) {
  cachedTaxRules = rules;
  taxRulesLoaded = true;
}

export function getCachedTaxRules(): TaxRule[] {
  return cachedTaxRules;
}

export function areTaxRulesLoaded(): boolean {
  return taxRulesLoaded;
}

function normalizeCategoryId(categoryId?: string | number | null) {
  if (categoryId == null || categoryId === "") return null;
  return String(categoryId);
}

/** Match web: rates are stored as percent strings (e.g. "21") → fraction. */
function normalizeRate(rate: number | string | null | undefined) {
  const numeric =
    typeof rate === "number"
      ? rate
      : typeof rate === "string"
        ? Number(rate)
        : NaN;

  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  // Web always divides by 100; also accept already-fractional values (< 1)
  if (numeric > 1) return numeric / 100;
  return numeric;
}

/**
 * Resolve VAT rate the same way as asian-spices-web `lib/commerce/tax.ts`:
 * category rule → global rule → 21%. Returns 0 while rules are still loading.
 */
export function resolveTaxRate(
  taxRules: TaxRule[],
  categoryId?: string | number | null,
  options?: { loaded?: boolean },
): number {
  if (options?.loaded === false) return 0;

  const normalizedCategoryId = normalizeCategoryId(categoryId);

  if (normalizedCategoryId) {
    const categoryRule = taxRules.find(
      (rule) => normalizeCategoryId(rule.category_id) === normalizedCategoryId,
    );
    if (categoryRule) {
      const rate = normalizeRate(categoryRule.tax_rate);
      if (rate != null) return rate;
    }
  }

  const globalRule = taxRules.find(
    (rule) => normalizeCategoryId(rule.category_id) === null,
  );
  if (globalRule) {
    const rate = normalizeRate(globalRule.tax_rate);
    if (rate != null) return rate;
  }

  return 0.21;
}

/** VAT rate from cached API rules (category → global → 21% once loaded). */
export function getVatRate(categoryId?: string | number | null): number {
  return resolveTaxRate(cachedTaxRules, categoryId, { loaded: taxRulesLoaded });
}

/** Display percentage for labels, e.g. 21 or 9. */
export function getVatRatePercent(categoryId?: string | number | null): number | null {
  if (!taxRulesLoaded) return null;
  const rate = getVatRate(categoryId);
  if (rate <= 0) return null;
  return Math.round(rate * 100);
}

export function getCartItemVatPercent(item: CartItem, rules: TaxRule[]): number | null {
  if (rules.length > 0 || taxRulesLoaded) {
    cachedTaxRules = rules.length > 0 ? rules : cachedTaxRules;
    taxRulesLoaded = true;
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
  if (taxRulesLoaded) {
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

  if (rules.length > 0 || taxRulesLoaded) {
    cachedTaxRules = rules.length > 0 ? rules : cachedTaxRules;
    taxRulesLoaded = true;
  }

  const totalTax = items.reduce((acc, item) => {
    const meta = getProductMeta(item.id);
    const lineGross = item.price * item.quantity;
    return acc + extractVatFromGross(lineGross, meta?.categoryId);
  }, 0);

  return Number(totalTax.toFixed(2));
}

export function getCartItemTax(item: CartItem, rules: TaxRule[]) {
  if (rules.length > 0 || taxRulesLoaded) {
    cachedTaxRules = rules.length > 0 ? rules : cachedTaxRules;
    taxRulesLoaded = true;
  }

  const meta = getProductMeta(item.id);
  const lineGross = item.price * item.quantity;
  return extractVatFromGross(lineGross, meta?.categoryId);
}

void ensureTaxRulesLoaded();
