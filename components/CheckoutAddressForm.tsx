import {
  ADDRESS_LABELS,
  type AddressFormData,
  type AddressType,
} from "@/types/address";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

type CheckoutAddressFormProps = {
  type: AddressType;
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
  type,
  values,
  onChange,
  onSave,
  saving,
}: CheckoutAddressFormProps) {
  const isHome = type === "home";

  return (
    <View className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] p-4 mb-3">
      <View className="flex-row items-center mb-4">
        <View className="w-9 h-9 rounded-full bg-[#FFF7ED] justify-center items-center mr-2">
          <Ionicons
            name={isHome ? "home-outline" : "business-outline"}
            size={18}
            color="#FF9800"
          />
        </View>
        <Text className="text-base font-bold text-black">
          {ADDRESS_LABELS[type]} Address
        </Text>
      </View>

      <Text className="text-[#6B7280] text-sm mb-4">
        {isHome
          ? "Add your home delivery address."
          : "Add your office delivery address."}
      </Text>

      <FormField
        label="Street Address"
        icon="location-outline"
        value={values.street}
        onChangeText={(text) => onChange("street", text)}
        placeholder={isHome ? "123 Main Street, Apt 4B" : "456 Business Ave, Suite 200"}
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
            label="State"
            icon="map-outline"
            value={values.state}
            onChangeText={(text) => onChange("state", text)}
            placeholder="NY"
          />
        </View>
        <View className="flex-1">
          <FormField
            label="Zip Code"
            icon="mail-outline"
            value={values.zipCode}
            onChangeText={(text) => onChange("zipCode", text)}
            placeholder={isHome ? "10001" : "10002"}
            keyboardType="number-pad"
          />
        </View>
      </View>
      <FormField
        label="Phone Number"
        icon="call-outline"
        value={values.phone}
        onChangeText={(text) => onChange("phone", text)}
        placeholder={isHome ? "+1 (555) 123-4567" : "+1 (555) 987-6543"}
        keyboardType="phone-pad"
      />

      <TouchableOpacity
        onPress={onSave}
        disabled={saving}
        className="bg-[#FF9800] rounded-xl py-3.5 mt-2 items-center"
        activeOpacity={0.85}
      >
        <Text className="text-white text-base font-semibold">
          {saving ? "Saving..." : `Save ${ADDRESS_LABELS[type]} Address`}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
