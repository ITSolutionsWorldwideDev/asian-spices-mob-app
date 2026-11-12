import { apiRequest } from "@/shared/services/api/httpClient";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const SELECTED_COUNTRY_STORAGE_KEY = "@asian_spices_selected_country";
export const DEFAULT_COUNTRY_ISO2 = "NL";

/** Same shape returned by GET /api/countries */
export type Country = {
  id: string | number;
  name: string;
  iso2: string;
  currency_code?: string | null;
  is_shippable?: boolean;
};

type CountryLookup = Pick<Country, "name"> & {
  iso2?: string;
};

export async function fetchCountries(): Promise<Country[]> {
  const rows = await apiRequest<Country[]>("/api/countries?shippable=true");
  return Array.isArray(rows) ? rows : [];
}

export async function getStoredCountry(): Promise<Country | null> {
  const raw = await AsyncStorage.getItem(SELECTED_COUNTRY_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Country;
  } catch {
    return null;
  }
}

export async function saveSelectedCountry(country: Country): Promise<void> {
  await AsyncStorage.setItem(SELECTED_COUNTRY_STORAGE_KEY, JSON.stringify(country));
}

export function findCountryByIso2(
  countries: Country[],
  iso2: string,
): Country | null {
  const normalized = iso2.trim().toUpperCase();
  return (
    countries.find((c) => String(c.iso2).toUpperCase() === normalized) ?? null
  );
}

export function getDefaultCountry(countries: Country[]): Country | null {
  return findCountryByIso2(countries, DEFAULT_COUNTRY_ISO2);
}

export function getCountryDisplayName(
  countryValue: string,
  countries: CountryLookup[] = [],
): string {
  const trimmed = countryValue.trim();
  if (!trimmed) return "";

  const byIso2 = countries.find(
    (entry) =>
      entry.iso2?.trim().toUpperCase() === trimmed.toUpperCase(),
  );
  if (byIso2) return byIso2.name;

  const byName = countries.find(
    (entry) => entry.name.trim().toLowerCase() === trimmed.toLowerCase(),
  );
  if (byName) return byName.name;

  return trimmed;
}

export function isCountrySelected(
  countryValue: string,
  country: CountryLookup,
): boolean {
  const trimmed = countryValue.trim();
  if (!trimmed) return false;

  const iso2 = country.iso2?.trim();
  if (iso2 && trimmed.toUpperCase() === iso2.toUpperCase()) {
    return true;
  }

  return trimmed.toLowerCase() === country.name.trim().toLowerCase();
}

/** Keep saved country if present; otherwise default to Netherlands (NL). */
export function resolveDefaultCountry(
  countries: Country[],
  storedCountry?: Country | null,
): Country | null {
  if (storedCountry) {
    const matched =
      countries.find(
        (c) =>
          String(c.id) === String(storedCountry.id) ||
          String(c.iso2).toUpperCase() ===
            String(storedCountry.iso2).toUpperCase(),
      ) ?? null;
    if (matched) return matched;
  }

  return getDefaultCountry(countries);
}
