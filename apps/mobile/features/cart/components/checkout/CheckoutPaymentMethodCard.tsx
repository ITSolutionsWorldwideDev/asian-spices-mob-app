import type { PaymentMethod } from "@/features/cart/types/checkout";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type CheckoutPaymentMethodCardProps = {
  method: PaymentMethod;
  selected: boolean;
  onPress: () => void;
};

export default function CheckoutPaymentMethodCard({
  method,
  selected,
  onPress,
}: CheckoutPaymentMethodCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className={`rounded-xl border p-4 mb-3 flex-row items-center ${
        selected ? "border-[#FF9800] bg-[#FFF7ED]" : "border-[#E5E7EB] bg-white"
      }`}
    >
      <View className="w-10 h-10 rounded-lg bg-[#F3F4F6] justify-center items-center mr-3">
        <Ionicons name={method.icon} size={20} color="#6B7280" />
      </View>
      <View className="flex-1">
        <Text className="text-base font-bold text-black">{method.title}</Text>
        <Text className="text-[#6B7280] text-sm mt-0.5">{method.subtitle}</Text>
      </View>
      {selected ? (
        <Ionicons name="checkmark-circle" size={22} color="#FF9800" />
      ) : (
        <View className="w-[22px] h-[22px] rounded-full border-2 border-[#D1D5DB]" />
      )}
    </TouchableOpacity>
  );
}
