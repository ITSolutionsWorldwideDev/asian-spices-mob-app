import {
  ADDRESS_TYPES,
  ADDRESS_LABELS,
  addressToFormData,
  createEmptyAddressForm,
  isAddressFormComplete,
  type AddressFormData,
  type AddressType,
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
  defaultFullName?: string;
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
  keyboardType?: "default" | "phone-pad" | "number-pad";
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
  defaultFullName = "",
  onClose,
  onSave,
}: AddressFormModalProps) {
  const [form, setForm] = useState<AddressFormData>(createEmptyAddressForm());
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(address);

  useEffect(() => {
    if (!visible) return;
    if (address) {
      setForm(addressToFormData(address));
      return;
    }
    setForm({
      ...createEmptyAddressForm("home"),
      fullName: defaultFullName,
    });
  }, [visible, address, defaultFullName]);

  const updateField = (field: keyof AddressFormData, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleTypeSelect = (type: AddressType) => {
    setForm((current) => ({ ...current, type }));
  };

  const handleSave = async () => {
    if (!isAddressFormComplete(form)) {
      Alert.alert("Missing fields", "Please fill in all address fields.");
      return;
    }

    setSaving(true);
    try {
      await onSave(form, address?.id);
      onClose();
    } catch {
      Alert.alert("Error", "Could not save your address. Please try again.");
    } finally {
      setSaving(false);
    }
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
                <Text className="text-[13px] font-semibold text-[#374151] mb-2">
                  Address Label
                </Text>
                <View className="flex-row gap-2 mb-4">
                  {ADDRESS_TYPES.map((type) => {
                    const selected = form.type === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        onPress={() => handleTypeSelect(type)}
                        className={`flex-1 py-2.5 rounded-xl border items-center ${
                          selected
                            ? "bg-[#FF9800] border-[#FF9800]"
                            : "bg-white border-[#E5E7EB]"
                        }`}
                        activeOpacity={0.85}
                      >
                        <Text
                          className={`text-[14px] font-semibold ${
                            selected ? "text-white" : "text-[#6B7280]"
                          }`}
                        >
                          {ADDRESS_LABELS[type]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <ModalField
                  label="Full Name"
                  value={form.fullName}
                  onChangeText={(text) => updateField("fullName", text)}
                  placeholder="John Doe"
                />
                <ModalField
                  label="Street Address"
                  value={form.street}
                  onChangeText={(text) => updateField("street", text)}
                  placeholder="123 Main Street, Apt 4B"
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
                    placeholder="10001"
                    keyboardType="number-pad"
                    className="flex-1 mb-4"
                  />
                  <ModalField
                    label="Phone"
                    value={form.phone}
                    onChangeText={(text) => updateField("phone", text)}
                    placeholder="+1 234 567 8900"
                    keyboardType="phone-pad"
                    className="flex-1 mb-4"
                  />
                </View>

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
    </Modal>
  );
}
