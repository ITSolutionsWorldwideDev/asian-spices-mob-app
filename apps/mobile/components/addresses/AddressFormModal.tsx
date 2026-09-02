import {
    getShippableCountries,
    type CountryOption,
} from "@/services/addressService";
import { getCountryDisplayName, isCountrySelected } from "@/services/countryService";
import {
    addressToFormData,
    createEmptyAddressForm,
    isAddressFormComplete,
    type AddressFormData,
    type DeliveryAddress,
} from "@/types/address";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type AddressFormModalProps = {
  visible: boolean;
  address?: DeliveryAddress | null;
  onClose: () => void;
  onSave: (data: AddressFormData, existingId?: string) => Promise<void>;
};

function ModalField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  className,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "phone-pad" | "number-pad" | "email-address";
  className?: string;
}) {
  return (
    <View className={className ?? "mb-4"}>
      <Text className="text-[13px] font-semibold text-[#374151] mb-1.5">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType}
        className="bg-white border border-[#E5E7EB] rounded-xl px-4 h-[48px] text-[15px] text-black"
      />
    </View>
  );
}

export default function AddressFormModal({
  visible,
  address,
  onClose,
  onSave,
}: AddressFormModalProps) {
  const [form, setForm] = useState<AddressFormData>(createEmptyAddressForm());
  const [saving, setSaving] = useState(false);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const isEditing = Boolean(address);

  useEffect(() => {
    if (!visible) return;
    if (address) {
      setForm(addressToFormData(address));
      return;
    }
    setForm({
      ...createEmptyAddressForm("other"),
    });
  }, [visible, address]);

  useEffect(() => {
    if (!visible) return;
    setCountriesLoading(true);
    getShippableCountries()
      .then(setCountries)
      .catch(() => {
        setCountries([]);
      })
      .finally(() => setCountriesLoading(false));
  }, [visible]);

  const updateField = (field: keyof AddressFormData, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    const payload: AddressFormData = {
      ...form,
      type: "other",
      fullName: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    };

    if (!isAddressFormComplete(payload)) {
      Alert.alert("Missing fields", "Please fill in all address fields.");
      return;
    }

    setSaving(true);
    try {
      await onSave(payload, address?.id);
      onClose();
    } catch {
      Alert.alert("Error", "Could not save your address. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const toggleCheckbox = (
    field: "isShippingAddress" | "isBillingAddress"
  ) => {
    setForm((current) => {
      const next = { ...current, [field]: !current[field] };
      if (!next.isShippingAddress && !next.isBillingAddress) {
        Alert.alert(
          "Address type required",
          "Select at least one: shipping address or billing address."
        );
        return current;
      }
      return next;
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40 justify-center px-5" onPress={onClose}>
        <Pressable onPress={(event) => event.stopPropagation()}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <View className="bg-white rounded-2xl max-h-[90%] overflow-hidden">
              <View className="flex-row items-center justify-between px-5 pt-5 pb-3">
                <Text className="text-[18px] font-bold text-black">
                  {isEditing ? "Edit Address" : "Add Address"}
                </Text>
                <TouchableOpacity
                  onPress={onClose}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={24} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              <ScrollView
                contentContainerClassName="px-5 pb-5"
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View className="mb-4">
                  <Text className="text-[13px] font-semibold text-[#111827] mb-3">
                    Address Information
                  </Text>
                </View>
                <ModalField
                  label="Street Address"
                  value={form.street}
                  onChangeText={(text) => updateField("street", text)}
                  placeholder="123 Main Street, Apt 4B"
                />
                <ModalField
                  label="Apartment / Suite"
                  value={form.apartment}
                  onChangeText={(text) => updateField("apartment", text)}
                  placeholder="Apt 4B"
                />
                <View className="flex-row gap-3">
                  <ModalField
                    label="City"
                    value={form.city}
                    onChangeText={(text) => updateField("city", text)}
                    placeholder="New York"
                    className="flex-1 mb-4"
                  />
                  <ModalField
                    label="State"
                    value={form.state}
                    onChangeText={(text) => updateField("state", text)}
                    placeholder="NY"
                    className="flex-1 mb-4"
                  />
                </View>
                <View className="flex-row gap-3">
                  <ModalField
                    label="ZIP Code"
                    value={form.zipCode}
                    onChangeText={(text) => updateField("zipCode", text)}
                    placeholder="3011 AB"
                    className="flex-1 mb-4"
                  />
                </View>

                <Text className="text-[13px] font-semibold text-[#374151] mb-1.5">Country</Text>
                <TouchableOpacity
                  onPress={() => setCountryPickerVisible(true)}
                  activeOpacity={0.85}
                  className="bg-white border border-[#E5E7EB] rounded-xl px-4 h-[48px] mb-4 flex-row items-center justify-between"
                >
                  <Text className={form.country ? "text-[15px] text-black" : "text-[15px] text-[#9CA3AF]"}>
                    {getCountryDisplayName(form.country, countries) ||
                      (countriesLoading ? "Loading countries..." : "Select country")}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
                </TouchableOpacity>

                <Text className="text-[13px] font-semibold text-[#111827] mb-2">
                  Address Type
                </Text>
                <TouchableOpacity
                  onPress={() => toggleCheckbox("isShippingAddress")}
                  activeOpacity={0.85}
                  className="flex-row items-center mb-2"
                >
                  <Ionicons
                    name={form.isShippingAddress ? "checkbox" : "square-outline"}
                    size={22}
                    color="#FF9800"
                  />
                  <Text className="text-[15px] text-[#374151] ml-2">Use as shipping address</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => toggleCheckbox("isBillingAddress")}
                  activeOpacity={0.85}
                  className="flex-row items-center mb-4"
                >
                  <Ionicons
                    name={form.isBillingAddress ? "checkbox" : "square-outline"}
                    size={22}
                    color="#FF9800"
                  />
                  <Text className="text-[15px] text-[#374151] ml-2">Use as billing address</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSave}
                  disabled={saving}
                  className="bg-[#FF9800] rounded-xl py-3.5 flex-row items-center justify-center mt-1"
                  activeOpacity={0.85}
                >
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text className="text-white text-[15px] font-semibold">
                    {saving ? "Saving..." : "Save Changes"}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Pressable>
      </Pressable>

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
                    updateField("country", country.iso2 ?? country.name);
                    setCountryPickerVisible(false);
                  }}
                  className="py-3 border-b border-[#F3F4F6] flex-row items-center justify-between"
                  activeOpacity={0.85}
                >
                  <Text className="text-[15px] text-[#111827]">{country.name}</Text>
                  {isCountrySelected(form.country, country) ? (
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
    </Modal>
  );
}
