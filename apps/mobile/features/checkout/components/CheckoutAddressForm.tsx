import { fetchCountries, getCountryDisplayName, isCountrySelected, type Country } from "@/shared/services/country/countryService";
import { type AddressFormData } from "@/features/profile/types/address";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type CheckoutAddressFormProps = {
  values: AddressFormData;
  onChange: (field: keyof AddressFormData, value: string) => void;
  onSave: () => void;
  saving?: boolean;
};

function FormField({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: "default" | "phone-pad" | "number-pad";
}) {
  return (
    <View className="mb-3">
      <Text className="text-sm font-medium text-[#374151] mb-1.5">{label}</Text>
      <View className="flex-row items-center bg-white border border-[#E5E7EB] rounded-xl px-4 h-[50px]">
        <Ionicons name={icon} size={18} color="#9CA3AF" />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          keyboardType={keyboardType}
          className="flex-1 ml-3 text-[15px] text-[#111827]"
        />
      </View>
    </View>
  );
}

export default function CheckoutAddressForm({
  values,
  onChange,
  onSave,
  saving,
}: CheckoutAddressFormProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);

  useEffect(() => {
    setCountriesLoading(true);
    fetchCountries()
      .then(setCountries)
      .catch(() => setCountries([]))
      .finally(() => setCountriesLoading(false));
  }, []);

  return (
    <View className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] p-4 mb-3">
      <View className="flex-row items-center mb-3">
        <View className="w-9 h-9 rounded-full bg-[#FFF7ED] justify-center items-center mr-2">
          <Ionicons name="location-outline" size={18} color="#FF9800" />
        </View>
        <Text className="text-base font-bold text-black">Delivery Address</Text>
      </View>

      <Text className="text-[#6B7280] text-sm mb-5">
        Add your delivery details for checkout.
      </Text>

      <View className="mb-4">
        <Text className="text-[13px] font-semibold text-[#111827] mb-3">Contact Information</Text>
        <FormField
          label="Email"
          icon="mail-outline"
          value={values.email}
          onChangeText={(text) => onChange("email", text)}
          placeholder="john@example.com"
        />
        <FormField
          label="Phone Number"
          icon="call-outline"
          value={values.phone}
          onChangeText={(text) => onChange("phone", text)}
          placeholder="+1 (555) 123-4567"
          keyboardType="phone-pad"
        />
      </View>

      <View className="mb-1">
        <Text className="text-[13px] font-semibold text-[#111827] mb-3">Delivery Information</Text>
      </View>
      <View className="flex-row gap-3">
        <View className="flex-1">
          <FormField
            label="First Name"
            icon="person-outline"
            value={values.firstName}
            onChangeText={(text) => onChange("firstName", text)}
            placeholder="John"
          />
        </View>
        <View className="flex-1">
          <FormField
            label="Last Name (optional)"
            icon="person-outline"
            value={values.lastName}
            onChangeText={(text) => onChange("lastName", text)}
            placeholder="Doe"
          />
        </View>
      </View>
      <FormField
        label="Street Address (Address Line 1)"
        icon="location-outline"
        value={values.street}
        onChangeText={(text) => onChange("street", text)}
        placeholder="123 Main Street"
      />
      <FormField
        label="Apartment, Suite, Unit, etc. (Address Line 2)"
        icon="home-outline"
        value={values.apartment}
        onChangeText={(text) => onChange("apartment", text)}
        placeholder="Apt 4B, Floor 2 (optional)"
      />
      <FormField
        label="City"
        icon="business-outline"
        value={values.city}
        onChangeText={(text) => onChange("city", text)}
        placeholder="New York"
      />
      <View className="flex-row gap-3">
        <View className="flex-1">
          <FormField
            label="State / Province (optional)"
            icon="map-outline"
            value={values.state}
            onChangeText={(text) => onChange("state", text)}
            placeholder="Noord-Holland"
          />
        </View>
        <View className="flex-1">
          <FormField
            label="Zip Code"
            icon="mail-outline"
            value={values.zipCode}
            onChangeText={(text) => onChange("zipCode", text)}
            placeholder="3011 AB"
          />
        </View>
      </View>
      <View className="mb-3">
        <Text className="text-sm font-medium text-[#374151] mb-1.5">Country</Text>
        <TouchableOpacity
          onPress={() => setCountryPickerVisible(true)}
          activeOpacity={0.85}
          className="flex-row items-center bg-white border border-[#E5E7EB] rounded-xl px-4 h-[50px]"
        >
          <Ionicons name="flag-outline" size={18} color="#9CA3AF" />
          <Text
            className={`flex-1 ml-3 text-[15px] ${
              values.country ? "text-[#111827]" : "text-[#9CA3AF]"
            }`}
          >
            {getCountryDisplayName(values.country, countries) ||
              (countriesLoading ? "Loading countries..." : "Select country")}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
      <FormField
        label="Full Name (optional)"
        icon="person-outline"
        value={values.fullName}
        onChangeText={(text) => onChange("fullName", text)}
        placeholder="John Doe"
      />

      <TouchableOpacity
        onPress={onSave}
        disabled={saving}
        className="bg-[#FF9800] rounded-xl py-3.5 mt-2 items-center"
        activeOpacity={0.85}
      >
        <Text className="text-white text-base font-semibold">
          {saving ? "Saving..." : "Save Delivery Address"}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={countryPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCountryPickerVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-end"
          onPress={() => setCountryPickerVisible(false)}
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            className="bg-white rounded-t-3xl p-5 max-h-[70%]"
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-[18px] font-bold text-black">Select Country</Text>
              <TouchableOpacity onPress={() => setCountryPickerVisible(false)}>
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {countries.map((country) => (
                <TouchableOpacity
                  key={country.id}
                  onPress={() => {
                    onChange("country", country.iso2 || country.name);
                    setCountryPickerVisible(false);
                  }}
                  className="py-3 border-b border-[#F3F4F6] flex-row items-center justify-between"
                  activeOpacity={0.85}
                >
                  <View>
                    <Text className="text-[15px] text-[#111827]">{country.name}</Text>
                    {country.iso2 ? (
                      <Text className="text-[12px] text-[#9CA3AF] mt-0.5">{country.iso2}</Text>
                    ) : null}
                  </View>
                  {isCountrySelected(values.country, country) ? (
                    <Ionicons name="checkmark" size={18} color="#FF9800" />
                  ) : null}
                </TouchableOpacity>
              ))}
              {!countriesLoading && countries.length === 0 ? (
                <Text className="text-[#6B7280] py-4">No countries available.</Text>
              ) : null}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
