import {
  BASE_CURRENCY,
  convertPrice,
  fetchCurrencies,
  fetchCurrencyRate,
  formatCurrencyLabel,
  formatMoney,
  getStoredCurrency,
  saveSelectedCurrency,
  type Currency,
} from "@/shared/services/currency/currencyService";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type CurrencyContextValue = {
  isReady: boolean;
  currencies: Currency[];
  selectedCurrency: Currency | null;
  currencyCode: string;
  currencySymbol: string;
  rate: number;
  setCurrency: (currency: Currency) => Promise<void>;
  formatPrice: (amountInBaseCurrency: number) => string;
  convertFromBase: (amountInBaseCurrency: number) => number;
  formatCurrencyLabel: (currency: Currency) => string;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
  const [currencyCode, setCurrencyCode] = useState(BASE_CURRENCY);
  const [currencySymbol, setCurrencySymbol] = useState("€");
  const [rate, setRate] = useState(1);

  const applyCurrency = useCallback(async (currency: Currency) => {
    const code = String(currency.code ?? "").trim().toUpperCase() || BASE_CURRENCY;
    let symbol = String(currency.symbol ?? "").trim() || code;

    setSelectedCurrency(currency);
    setCurrencyCode(code);
    setCurrencySymbol(symbol);

    const isBase = Boolean(currency.is_base) || code === BASE_CURRENCY;
    if (isBase) {
      setRate(1);
      await saveSelectedCurrency(currency);
      return;
    }

    try {
      const ratePayload = await fetchCurrencyRate(code);
      setRate(ratePayload.rate);
      if (ratePayload.symbol) {
        symbol = ratePayload.symbol;
        setCurrencySymbol(symbol);
      }
    } catch (error) {
      console.error("Failed to fetch currency rate", error);
      setRate(1);
    }

    await saveSelectedCurrency({ ...currency, symbol, code });
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [list, stored] = await Promise.all([
          fetchCurrencies().catch(() => [] as Currency[]),
          getStoredCurrency(),
        ]);

        if (cancelled) return;
        setCurrencies(list);

        const matched =
          (stored
            ? list.find(
                (c) =>
                  String(c.id) === String(stored.id) ||
                  String(c.code).toUpperCase() ===
                    String(stored.code).toUpperCase(),
              )
            : null) ||
          list.find((c) => c.is_base) ||
          list.find((c) => String(c.code).toUpperCase() === BASE_CURRENCY) ||
          list[0] ||
          null;

        if (matched) {
          await applyCurrency(matched);
        }
      } catch (error) {
        console.error("Currency bootstrap failed", error);
      } finally {
        if (!cancelled) setIsReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [applyCurrency]);

  const convertFromBase = useCallback(
    (amountInBaseCurrency: number) =>
      convertPrice(amountInBaseCurrency, rate, currencyCode, BASE_CURRENCY),
    [currencyCode, rate],
  );

  const formatPrice = useCallback(
    (amountInBaseCurrency: number) =>
      formatMoney(convertFromBase(amountInBaseCurrency), currencySymbol),
    [convertFromBase, currencySymbol],
  );

  const value = useMemo(
    () => ({
      isReady,
      currencies,
      selectedCurrency,
      currencyCode,
      currencySymbol,
      rate,
      setCurrency: applyCurrency,
      formatPrice,
      convertFromBase,
      formatCurrencyLabel,
    }),
    [
      isReady,
      currencies,
      selectedCurrency,
      currencyCode,
      currencySymbol,
      rate,
      applyCurrency,
      formatPrice,
      convertFromBase,
    ],
  );

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return context;
}
