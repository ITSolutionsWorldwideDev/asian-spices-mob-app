import { apiRequest } from "@/services/api/httpClient";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const SELECTED_CURRENCY_STORAGE_KEY = "@asian_spices_selected_currency";
export const BASE_CURRENCY = "EUR";

/** Same shape returned by GET /api/currencies */
export type Currency = {
  id: string | number;
  name: string;
  code: string;
  symbol: string;
  is_base?: boolean;
};

export type CurrencyRatePayload = {
  rate?: number | string | null;
  symbol?: string | null;
};

export async function fetchCurrencies(): Promise<Currency[]> {
  const rows = await apiRequest<Currency[]>("/api/currencies");
  return Array.isArray(rows) ? rows : [];
}

/** Same as GET /api/currency-rate?code=USD → { rate, symbol } */
export async function fetchCurrencyRate(
  code: string,
): Promise<{ rate: number; symbol?: string }> {
  const normalized = String(code ?? "").trim().toUpperCase();
  if (!normalized || normalized === BASE_CURRENCY) {
    return { rate: 1 };
  }

  const payload = await apiRequest<CurrencyRatePayload>(
    `/api/currency-rate?code=${encodeURIComponent(normalized)}`,
  );

  const rate = Number(payload?.rate);
  return {
    rate: Number.isFinite(rate) && rate > 0 ? rate : 1,
    symbol: payload?.symbol ? String(payload.symbol) : undefined,
  };
}

export async function getStoredCurrency(): Promise<Currency | null> {
  const raw = await AsyncStorage.getItem(SELECTED_CURRENCY_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Currency;
  } catch {
    return null;
  }
}

export async function saveSelectedCurrency(currency: Currency): Promise<void> {
  await AsyncStorage.setItem(
    SELECTED_CURRENCY_STORAGE_KEY,
    JSON.stringify(currency),
  );
}

export function convertPrice(
  amount: number,
  rate: number,
  currencyCode: string,
  baseCurrency: string = BASE_CURRENCY,
) {
  if (!amount) return 0;
  if (!currencyCode || currencyCode === baseCurrency) return amount;
  return amount * (rate > 0 ? rate : 1);
}

export function formatMoney(amount: number, symbol: string) {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `${symbol}${safe.toFixed(2)}`;
}

export function formatCurrencyLabel(currency: Currency) {
  const code = String(currency.code ?? "").trim();
  const symbol = String(currency.symbol ?? "").trim();
  if (code && symbol) return `${code} (${symbol})`;
  return code || symbol || String(currency.name ?? "Currency");
}
