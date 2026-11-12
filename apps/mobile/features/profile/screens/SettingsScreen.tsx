import AppTabBar from "@/shared/components/AppTabBar";
import ProfileMenuSection from "@/features/profile/components/ProfileMenuSection";
import SettingsMenuItem from "@/features/profile/components/settings/SettingsMenuItem";
import { useCurrency } from "@/shared/contexts/CurrencyContext";
import {
  fetchCountries,
  getStoredCountry,
  resolveDefaultCountry,
  saveSelectedCountry,
  type Country,
} from "@/features/cart/services/countryService";
import {
  BASE_CURRENCY,
  formatCurrencyLabel,
  type Currency,
} from "@/shared/services/currency/currencyService";
import { getSettingsData } from "@/features/profile/services/settingsService";
import type { UserPreferences } from "@/features/profile/types/settings";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type PickerKind = "country" | "currency" | null;

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    currencies,
    selectedCurrency,
    setCurrency,
    isReady: currencyReady,
  } = useCurrency();

  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [loading, setLoading] = useState(true);
  const [countriesError, setCountriesError] = useState<string | null>(null);
  const [picker, setPicker] = useState<PickerKind>(null);
  const [search, setSearch] = useState("");
  const bootstrapDone = useRef(false);

  useEffect(() => {
    if (!currencyReady || bootstrapDone.current) return;

    let cancelled = false;

    (async () => {
      try {
        const settings = await getSettingsData();
        if (cancelled) return;
        setPreferences(settings.preferences);

        const [countriesResult, storedCountry] = await Promise.allSettled([
          fetchCountries(),
          getStoredCountry(),
        ]);

        if (cancelled) return;

        const countriesList =
          countriesResult.status === "fulfilled" ? countriesResult.value : [];
        const stored =
          storedCountry.status === "fulfilled" ? storedCountry.value : null;

        setCountries(countriesList);
        setCountriesError(
          countriesResult.status === "rejected"
            ? countriesResult.reason instanceof Error
              ? countriesResult.reason.message
              : "Failed to load countries"
            : null,
        );

        // First time: Netherlands. Later: keep whatever the user saved.
        const matchedCountry = resolveDefaultCountry(countriesList, stored);

        if (matchedCountry) {
          setSelectedCountry(matchedCountry);

          if (!stored) {
            await saveSelectedCountry(matchedCountry);

            const euro =
              currencies.find(
                (c) => String(c.code).toUpperCase() === BASE_CURRENCY,
              ) ?? null;

            if (euro) {
              await setCurrency(euro);
            }
          }
        } else {
          setSelectedCountry(null);
        }

        bootstrapDone.current = true;
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currencyReady, currencies, setCurrency]);

  const filteredCountries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter((c) => {
      const name = String(c.name ?? "").toLowerCase();
      const iso2 = String(c.iso2 ?? "").toLowerCase();
      const currency = String(c.currency_code ?? "").toLowerCase();
      return name.includes(q) || iso2.includes(q) || currency.includes(q);
    });
  }, [countries, search]);

  const filteredCurrencies = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return currencies;
    return currencies.filter((c) => {
      const name = String(c.name ?? "").toLowerCase();
      const code = String(c.code ?? "").toLowerCase();
      const symbol = String(c.symbol ?? "").toLowerCase();
      return name.includes(q) || code.includes(q) || symbol.includes(q);
    });
  }, [currencies, search]);

  const closePicker = () => {
    setPicker(null);
    setSearch("");
  };

  const onSelectCountry = async (country: Country) => {
    setSelectedCountry(country);
    closePicker();
    await saveSelectedCountry(country);

    const code = country.currency_code
      ? String(country.currency_code).toUpperCase()
      : null;
    if (!code) return;

    const matched = currencies.find(
      (c) => String(c.code).toUpperCase() === code,
    );
    if (matched) {
      await setCurrency(matched);
    }
  };

  const onSelectCurrency = async (currency: Currency) => {
    closePicker();
    // Fetches /api/currency-rate and updates product price conversion app-wide.
    await setCurrency(currency);
  };

  const countrySubtitle = selectedCountry?.name
    ? String(selectedCountry.name)
    : (preferences?.country ?? "Select country");

  const currencySubtitle = selectedCurrency
    ? formatCurrencyLabel(selectedCurrency)
    : (preferences?.currency ?? "Select currency");

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <View
        className="bg-white border-b border-[#EAEAEA]"
        style={{ paddingTop: insets.top + 8, paddingBottom: 12 }}
      >
        <View className="flex-row items-center px-4">
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-9 h-9 justify-center items-center"
          >
            <Ionicons name="chevron-back" size={26} color="#333333" />
          </TouchableOpacity>
          <Text className="flex-1 text-center text-[18px] font-bold text-black mr-9">
            Settings
          </Text>
        </View>
      </View>

      {loading || !preferences || !currencyReady ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#FF9800" />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-4 pt-5 pb-6"
          showsVerticalScrollIndicator={false}
        >
          <ProfileMenuSection title="ACCOUNT">
            <SettingsMenuItem
              icon="person-outline"
              title="Edit Profile"
              onPress={() => router.push("/edit-profile")}
            />
            <SettingsMenuItem
              icon="lock-closed-outline"
              title="Change Password"
              onPress={() => router.push("/change-password")}
            />
            <SettingsMenuItem
              icon="shield-outline"
              title="Manage Addresses"
              showDivider={false}
              onPress={() => router.push("/my-addresses")}
            />
            {/* <SettingsMenuItem
              icon="card-outline"
              title="Payment Methods"
              showDivider={false}
              onPress={() => router.push("/payment-methods")}
            /> */}
          </ProfileMenuSection>

          <ProfileMenuSection title="NOTIFICATIONS">
            <SettingsMenuItem
              icon="notifications-outline"
              title="Notification Preferences"
              showDivider={false}
              onPress={() => router.push("/notification-preferences")}
            />
          </ProfileMenuSection>

          <ProfileMenuSection title="PREFERENCES">
            <SettingsMenuItem
              icon="globe-outline"
              title="Language"
              subtitle={preferences.language}
            />
            <SettingsMenuItem
              icon="globe-outline"
              title="Country/Region"
              subtitle={countrySubtitle}
              onPress={() => setPicker("country")}
            />
            <SettingsMenuItem
              icon="card-outline"
              title="Currency"
              subtitle={currencySubtitle}
              showDivider={false}
              onPress={() => setPicker("currency")}
            />
          </ProfileMenuSection>
        </ScrollView>
      )}

      <Modal
        visible={picker !== null}
        transparent
        animationType="slide"
        onRequestClose={closePicker}
      >
        <Pressable className="flex-1 bg-black/40 justify-end" onPress={closePicker}>
          <Pressable
            className="bg-white rounded-t-3xl max-h-[75%]"
            onPress={(event) => event.stopPropagation()}
          >
            <View className="flex-row items-center justify-between px-5 pt-5 pb-3">
              <Text className="text-[18px] font-bold text-black">
                {picker === "country" ? "Select Country" : "Select Currency"}
              </Text>
              <TouchableOpacity onPress={closePicker}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View className="px-5 pb-3">
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={
                  picker === "country"
                    ? "Search countries..."
                    : "Search currencies..."
                }
                placeholderTextColor="#9CA3AF"
                className="bg-[#F3F4F6] rounded-xl px-4 py-3 text-[15px] text-black"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {picker === "country" ? (
              <FlatList
                data={filteredCountries}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <Text className="text-center text-[#9CA3AF] py-8 px-6">
                    {countriesError
                      ? countriesError
                      : countries.length === 0
                        ? "No countries returned from API"
                        : "No results found"}
                  </Text>
                }
                renderItem={({ item: country }) => {
                  const selected =
                    selectedCountry != null &&
                    (String(selectedCountry.id) === String(country.id) ||
                      String(selectedCountry.iso2).toUpperCase() ===
                        String(country.iso2).toUpperCase());

                  return (
                    <TouchableOpacity
                      onPress={() => onSelectCountry(country)}
                      className="px-5 py-3.5 flex-row items-center justify-between border-b border-[#F3F4F6]"
                      activeOpacity={0.75}
                    >
                      <View className="flex-1 pr-3">
                        <Text className="text-[15px] text-[#111827]">
                          {country.name}
                        </Text>
                        <Text className="text-[12px] text-[#9CA3AF] mt-0.5">
                          {country.iso2}
                          {country.currency_code
                            ? ` · ${country.currency_code}`
                            : ""}
                        </Text>
                      </View>
                      {selected ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={22}
                          color="#FF9800"
                        />
                      ) : null}
                    </TouchableOpacity>
                  );
                }}
              />
            ) : (
              <FlatList
                data={filteredCurrencies}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <Text className="text-center text-[#9CA3AF] py-8 px-6">
                    {currencies.length === 0
                      ? "No currencies returned from API"
                      : "No results found"}
                  </Text>
                }
                renderItem={({ item: currency }) => {
                  const selected =
                    selectedCurrency != null &&
                    (String(selectedCurrency.id) === String(currency.id) ||
                      String(selectedCurrency.code).toUpperCase() ===
                        String(currency.code).toUpperCase());

                  return (
                    <TouchableOpacity
                      onPress={() => onSelectCurrency(currency)}
                      className="px-5 py-3.5 flex-row items-center justify-between border-b border-[#F3F4F6]"
                      activeOpacity={0.75}
                    >
                      <View className="flex-1 pr-3">
                        <Text className="text-[15px] text-[#111827]">
                          {formatCurrencyLabel(currency)}
                        </Text>
                        <Text className="text-[12px] text-[#9CA3AF] mt-0.5">
                          {currency.name}
                        </Text>
                      </View>
                      {selected ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={22}
                          color="#FF9800"
                        />
                      ) : null}
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <AppTabBar activeTab="profile" />
    </View>
  );
}
