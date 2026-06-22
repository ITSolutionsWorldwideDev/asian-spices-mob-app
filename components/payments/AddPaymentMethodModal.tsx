import banksData from "@/data/banks.json";
import {
  addCardPayment,
  addCashPayment,
  addNetBankingPayment,
  addUpiPayment,
  formatCardNumber,
  formatExpiry,
  isValidCardForm,
  isValidUpiForm,
} from "@/services/paymentMethodService";
import {
  createEmptyCardForm,
  type CardFormData,
  type SavedPaymentType,
} from "@/types/paymentMethod";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BANKS = banksData as string[];

const PAYMENT_TABS: {
  key: SavedPaymentType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: "card", label: "Card", icon: "card-outline" },
  { key: "upi", label: "UPI", icon: "phone-portrait-outline" },
  { key: "netbanking", label: "Net Banking", icon: "business-outline" },
  { key: "cash", label: "Cash", icon: "wallet-outline" },
];

type AddPaymentMethodModalProps = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
};

function ModalField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
  className,
  maxLength,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "number-pad" | "phone-pad";
  secureTextEntry?: boolean;
  className?: string;
  maxLength?: number;
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
        secureTextEntry={secureTextEntry}
        maxLength={maxLength}
        className="bg-white border border-[#E5E7EB] rounded-xl px-4 h-[48px] text-[15px] text-black"
      />
    </View>
  );
}

function SaveActionButton({
  label,
  saving,
  onPress,
  className,
}: {
  label: string;
  saving: boolean;
  onPress: () => void;
  className?: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={saving}
      className={`bg-[#FF9800] rounded-xl py-3.5 flex-row items-center justify-center ${className ?? ""}`}
      activeOpacity={0.85}
    >
      <Ionicons name="checkmark" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
      <Text className="text-white text-[15px] font-semibold">
        {saving ? "Saving..." : label}
      </Text>
    </TouchableOpacity>
  );
}

function CardPreview({ cardForm }: { cardForm: CardFormData }) {
  const displayNumber =
    cardForm.cardNumber.trim() || "**** **** **** ****";
  const displayName = cardForm.cardholderName.trim().toUpperCase() || "CARDHOLDER NAME";
  const displayExpiry = cardForm.expiry.trim() || "MM/YY";

  return (
    <LinearGradient
      colors={["#FF9800", "#FFC107"]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={{ borderRadius: 14, padding: 16, marginBottom: 16 }}
    >
      <Ionicons name="card" size={22} color="#FFFFFF" style={{ marginBottom: 12 }} />
      <Text className="text-white/80 text-[10px] mb-0.5">CARDHOLDER NAME</Text>
      <Text className="text-white text-[13px] font-bold mb-3">{displayName}</Text>
      <Text className="text-white text-[15px] font-semibold tracking-widest mb-2">
        {displayNumber}
      </Text>
      <Text className="text-white text-[12px]">{displayExpiry}</Text>
    </LinearGradient>
  );
}

export default function AddPaymentMethodModal({
  visible,
  onClose,
  onSaved,
}: AddPaymentMethodModalProps) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<SavedPaymentType>("card");
  const [cardForm, setCardForm] = useState<CardFormData>(createEmptyCardForm());
  const [showCvv, setShowCvv] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankPickerOpen, setBankPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setActiveTab("card");
    setCardForm(createEmptyCardForm());
    setShowCvv(false);
    setUpiId("");
    setBankName("");
    setBankPickerOpen(false);
  }, [visible]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (activeTab === "card") {
        if (!isValidCardForm(cardForm)) {
          Alert.alert("Invalid card", "Please fill in all card details correctly.");
          return;
        }
        await addCardPayment(cardForm);
      } else if (activeTab === "upi") {
        if (!isValidUpiForm({ upiId })) {
          Alert.alert("Invalid UPI ID", "Please enter a valid UPI ID (e.g. name@upi).");
          return;
        }
        await addUpiPayment({ upiId });
      } else if (activeTab === "netbanking") {
        if (!bankName) {
          Alert.alert("Select bank", "Please select your bank.");
          return;
        }
        await addNetBankingPayment({ bankName });
      } else {
        await addCashPayment();
      }
      onSaved();
      onClose();
    } catch {
      Alert.alert("Error", "Could not save payment method. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const saveLabel =
    activeTab === "card"
      ? "Add Card"
      : activeTab === "upi"
        ? "Add UPI"
        : activeTab === "netbanking"
          ? "Add Net Banking"
          : "Add Cash";

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/40" onPress={onClose} />

        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View
            className="bg-white rounded-t-3xl"
            style={{
              maxHeight: "92%",
              paddingBottom: Math.max(insets.bottom, 16),
            }}
          >
            <View className="flex-row items-center justify-between px-5 pt-5 pb-3">
              <Text className="text-[18px] font-bold text-black">Add Payment Method</Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="px-5 gap-2 pb-4"
              keyboardShouldPersistTaps="handled"
            >
              {PAYMENT_TABS.map((tab) => {
                const selected = activeTab === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    onPress={() => setActiveTab(tab.key)}
                    className={`flex-row items-center px-4 py-2.5 rounded-full border ${
                      selected
                        ? "bg-[#FF9800] border-[#FF9800]"
                        : "bg-white border-[#E5E7EB]"
                    }`}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name={tab.icon}
                      size={16}
                      color={selected ? "#FFFFFF" : "#6B7280"}
                    />
                    <Text
                      className={`text-[13px] font-semibold ml-1.5 ${
                        selected ? "text-white" : "text-[#6B7280]"
                      }`}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <ScrollView
              className="flex-shrink"
              style={{ maxHeight: 420 }}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, flexGrow: 1 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
                {activeTab === "card" ? (
                  <>
                    <CardPreview cardForm={cardForm} />
                    <ModalField
                      label="Card Number"
                      value={cardForm.cardNumber}
                      onChangeText={(text) =>
                        setCardForm((current) => ({
                          ...current,
                          cardNumber: formatCardNumber(text),
                        }))
                      }
                      placeholder="1234 5678 9012 3456"
                      keyboardType="number-pad"
                      maxLength={19}
                    />
                    <ModalField
                      label="Cardholder Name"
                      value={cardForm.cardholderName}
                      onChangeText={(text) =>
                        setCardForm((current) => ({ ...current, cardholderName: text }))
                      }
                      placeholder="As on card"
                    />
                    <View className="flex-row gap-3">
                      <ModalField
                        label="Expiry"
                        value={cardForm.expiry}
                        onChangeText={(text) =>
                          setCardForm((current) => ({
                            ...current,
                            expiry: formatExpiry(text),
                          }))
                        }
                        placeholder="MM/YY"
                        keyboardType="number-pad"
                        maxLength={5}
                        className="flex-1 mb-4"
                      />
                      <View className="flex-1 mb-4">
                        <View className="flex-row items-center justify-between mb-1.5">
                          <Text className="text-[13px] font-semibold text-[#374151]">CVV</Text>
                          <TouchableOpacity onPress={() => setShowCvv((prev) => !prev)}>
                            <Text className="text-[#FF9800] text-[12px] font-semibold">
                              {showCvv ? "Hide" : "Show"}
                            </Text>
                          </TouchableOpacity>
                        </View>
                        <TextInput
                          value={cardForm.cvv}
                          onChangeText={(text) =>
                            setCardForm((current) => ({
                              ...current,
                              cvv: text.replace(/\D/g, "").slice(0, 4),
                            }))
                          }
                          placeholder="***"
                          placeholderTextColor="#9CA3AF"
                          keyboardType="number-pad"
                          secureTextEntry={!showCvv}
                          maxLength={4}
                          className="bg-white border border-[#E5E7EB] rounded-xl px-4 h-[48px] text-[15px] text-black"
                        />
                      </View>
                    </View>
                  </>
                ) : null}

                {activeTab === "upi" ? (
                  <View className="items-center mb-4">
                    <View className="w-14 h-14 rounded-full bg-[#FFF3E0] justify-center items-center mb-4">
                      <Ionicons name="phone-portrait-outline" size={28} color="#FF9800" />
                    </View>
                    <Text className="text-[15px] font-semibold text-black text-center">
                      UPI Payment
                    </Text>
                    <Text className="text-[#6B7280] text-[14px] text-center mt-1 mb-5">
                      Pay directly from your bank account
                    </Text>
                    <View className="w-full">
                      <ModalField
                        label="UPI ID"
                        value={upiId}
                        onChangeText={setUpiId}
                        placeholder="yourname@upi"
                        keyboardType="default"
                      />
                      <Text className="text-[#9CA3AF] text-[12px] -mt-2 mb-2">
                        e.g. mobilenumber@paytm, name@icici, name@ybl
                      </Text>
                    </View>
                  </View>
                ) : null}

                {activeTab === "netbanking" ? (
                  <View className="items-center mb-4">
                    <View className="w-14 h-14 rounded-full bg-[#E3F2FD] justify-center items-center mb-4">
                      <Ionicons name="business-outline" size={28} color="#2196F3" />
                    </View>
                    <Text className="text-[15px] font-semibold text-black text-center">
                      Net Banking
                    </Text>
                    <Text className="text-[#6B7280] text-[14px] text-center mt-1 mb-5">
                      Pay using your bank account online
                    </Text>
                    <View className="w-full">
                      <Text className="text-[13px] font-semibold text-[#374151] mb-1.5">
                        Select Bank
                      </Text>
                      <TouchableOpacity
                        onPress={() => setBankPickerOpen((prev) => !prev)}
                        className="bg-white border border-[#E5E7EB] rounded-xl px-4 h-[48px] flex-row items-center justify-between mb-2"
                        activeOpacity={0.85}
                      >
                        <Text
                          className={`text-[15px] ${bankName ? "text-black" : "text-[#9CA3AF]"}`}
                        >
                          {bankName || "Choose your bank"}
                        </Text>
                        <Ionicons
                          name={bankPickerOpen ? "chevron-up" : "chevron-down"}
                          size={18}
                          color="#9CA3AF"
                        />
                      </TouchableOpacity>
                      {bankPickerOpen ? (
                        <View className="border border-[#E5E7EB] rounded-xl mb-4 overflow-hidden max-h-[160px]">
                          <ScrollView nestedScrollEnabled>
                            {BANKS.map((bank) => (
                              <TouchableOpacity
                                key={bank}
                                onPress={() => {
                                  setBankName(bank);
                                  setBankPickerOpen(false);
                                }}
                                className={`px-4 py-3 border-b border-[#F0F0F0] ${
                                  bankName === bank ? "bg-[#FFF7ED]" : "bg-white"
                                }`}
                              >
                                <Text className="text-[14px] text-black">{bank}</Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      ) : null}
                      <SaveActionButton
                        label="Add Net Banking"
                        saving={saving}
                        onPress={handleSave}
                        className="mt-4"
                      />
                    </View>
                  </View>
                ) : null}

                {activeTab === "cash" ? (
                  <View className="w-full items-center px-2 pb-4">
                    <View className="w-14 h-14 rounded-full bg-[#E8F5E9] justify-center items-center mb-4">
                      <Ionicons name="wallet-outline" size={28} color="#22C55E" />
                    </View>
                    <Text className="text-[16px] font-bold text-black text-center">
                      Cash on Delivery
                    </Text>
                    <Text className="text-[#6B7280] text-[14px] text-center mt-2 leading-5">
                      Pay with cash when your order arrives. No advance payment needed.
                    </Text>
                    <SaveActionButton
                      label="Add Cash"
                      saving={saving}
                      onPress={handleSave}
                      className="w-full mt-6"
                    />
                  </View>
                ) : null}

                {activeTab === "card" || activeTab === "upi" ? (
                  <SaveActionButton
                    label={saveLabel}
                    saving={saving}
                    onPress={handleSave}
                    className="mt-2"
                  />
                ) : null}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
