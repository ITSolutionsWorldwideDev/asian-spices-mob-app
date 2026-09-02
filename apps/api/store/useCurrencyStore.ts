// apps/web/store/useCurrencyStore.ts

import { create } from "zustand";
interface Currency {
  id: number;
  name: string;
  code: string;
  symbol: string;
  is_base: boolean;
}
interface CurrencyStore {
  currencies: Currency[];
  selectedCurrency: string;
  baseCurrency: string;
  rate: number;
  symbol: string;
  hasLoaded: boolean;

  fetchCurrencies: () => Promise<void>;
  setSelectedCurrency: (code: string) => Promise<void>;
  fetchRate: (code: string) => Promise<void>;
}

export const useCurrencyStore = create<CurrencyStore>((set, get) => ({
  currencies: [],
  selectedCurrency: "EUR",
  baseCurrency: "EUR",
  rate: 1,
  symbol: "€",
  hasLoaded: false,

  fetchCurrencies: async () => {
    const { hasLoaded } = get();
    if (hasLoaded) return;
    try {
      const res = await fetch("/api/currencies");

      const currencies: Currency[] = await res.json();

      const saved = localStorage.getItem("currency");

      const baseCurrency = currencies.find((c) => c.is_base)?.code || "EUR";

      const selected =
        currencies.find((c) => c.code === saved)?.code || baseCurrency;

      const currencyObj = currencies.find((c: any) => c.code === selected);

      set({
        currencies,
        selectedCurrency: selected,
        baseCurrency,
        symbol: currencyObj?.symbol || "€",
        hasLoaded: true,
      });

      if (selected !== baseCurrency) {
        await get().fetchRate(selected);
      } else {
        set({ rate: 1 });
      }
    } catch (err) {
      console.error("Error fetching currencies", err);
    }
  },

  // 🔹 Set currency + fetch rate

  setSelectedCurrency: async (code) => {
    const { currencies, baseCurrency } = get();

    const exists = currencies.some((c) => c.code === code);

    if (!exists) {
      console.warn("Invalid currency selected:", code);
      return;
    }

    localStorage.setItem("currency", code);

    const currencyObj = currencies.find((c) => c.code === code);

    set({
      selectedCurrency: code,
      symbol: currencyObj?.symbol || "",
    });

    if (code === baseCurrency) {
      set({ rate: 1 });
      return;
    }

    await get().fetchRate(code);
  },

  fetchRate: async (code) => {
    const { baseCurrency } = get();

    if (code === baseCurrency) {
      set({ rate: 1 });
      return;
    }

    try {
      const res = await fetch(`/api/currency-rate?code=${code}`);
      const data = await res.json();

      set({
        rate: data?.rate || 1,
      });
    } catch (err) {
      console.error("Error fetching rate", err);
    }
  },
}));
