import type { SavedPaymentMethod } from "@/features/profile/types/paymentMethod";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type SavedPaymentCardProps = {
  method: SavedPaymentMethod;
  onDelete: () => void;
  onSetDefault?: () => void;
};

function CardGradientView({ method }: { method: SavedPaymentMethod }) {
  return (
    <LinearGradient
      colors={["#FF9800", "#FFC107"]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={{ borderRadius: 16, padding: 20, minHeight: 160 }}
    >
      <View className="flex-row items-start justify-between mb-8">
        <Ionicons name="card" size={28} color="#FFFFFF" />
        {method.isDefault ? (
          <View className="bg-[#FFEB3B] rounded-full px-2.5 py-1">
            <Text className="text-[#5D4037] text-[11px] font-bold">Default</Text>
          </View>
        ) : null}
      </View>
      <Text className="text-white text-[18px] font-semibold tracking-wider mb-3">
        {method.cardBrand ?? "Card"} **** {method.last4 ?? "****"}
      </Text>
      <View className="flex-row items-end justify-between">
        <View>
          <Text className="text-white/80 text-[11px] mb-0.5">Expires</Text>
          <Text className="text-white text-[14px] font-medium">{method.expiry ?? "MM/YY"}</Text>
        </View>
        <Text className="text-white text-[14px] font-bold tracking-wide">
          {method.cardholderName ?? "CARDHOLDER"}
        </Text>
      </View>
    </LinearGradient>
  );
}

function SimplePaymentView({ method }: { method: SavedPaymentMethod }) {
  const iconName =
    method.type === "upi"
      ? "phone-portrait-outline"
      : method.type === "netbanking"
        ? "business-outline"
        : "wallet-outline";

  const subtitle =
    method.type === "upi"
      ? method.upiId
      : method.type === "netbanking"
        ? method.bankName
        : "Pay when your order arrives";

  const title =
    method.type === "upi"
      ? "UPI Payment"
      : method.type === "netbanking"
        ? "Net Banking"
        : "Cash on Delivery";

  return (
    <View className="bg-white rounded-2xl border border-[#EAEAEA] p-4 min-h-[100px]">
      <View className="flex-row items-start justify-between mb-2">
        <View className="w-10 h-10 rounded-full bg-[#FFF3E0] justify-center items-center">
          <Ionicons name={iconName} size={20} color="#FF9800" />
        </View>
        {method.isDefault ? (
          <View className="bg-[#FFF3E0] rounded-full px-2.5 py-1">
            <Text className="text-[#FF9800] text-[11px] font-semibold">Default</Text>
          </View>
        ) : null}
      </View>
      <Text className="text-[16px] font-bold text-black">{title}</Text>
      <Text className="text-[14px] text-[#6B7280] mt-1">{subtitle}</Text>
    </View>
  );
}

export default function SavedPaymentCard({
  method,
  onDelete,
  onSetDefault,
}: SavedPaymentCardProps) {
  return (
    <View className="mb-5">
      {method.type === "card" ? (
        <CardGradientView method={method} />
      ) : (
        <SimplePaymentView method={method} />
      )}

      <View className="flex-row items-center justify-between mt-3 px-1">
        {method.isDefault ? (
          <View className="flex-row items-center">
            <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
            <Text className="text-[#22C55E] text-[14px] font-medium ml-1.5">
              Active Default
            </Text>
          </View>
        ) : onSetDefault ? (
          <TouchableOpacity onPress={onSetDefault} activeOpacity={0.8}>
            <Text className="text-[#FF9800] text-[14px] font-semibold">Set as Default</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
        <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="trash-outline" size={22} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
