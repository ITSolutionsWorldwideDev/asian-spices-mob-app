import type { DeliveryAddress } from "@/types/address";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type CheckoutAddressCardProps = {
  address: DeliveryAddress;
  selected: boolean;
  onPress: () => void;
  onEdit: () => void;
};

export default function CheckoutAddressCard({
  address,
  selected,
  onPress,
  onEdit,
}: CheckoutAddressCardProps) {
  const isHome = address.type === "home";

  return (
    <View
      className={`rounded-xl border p-4 mb-3 ${
        selected ? "border-[#FF9800] bg-[#FFF7ED]" : "border-[#E5E7EB] bg-white"
      }`}
    >
      <View className="flex-row items-center justify-between mb-2">
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.85}
          className="flex-row items-center flex-1"
        >
          <Ionicons
            name={isHome ? "home-outline" : "business-outline"}
            size={18}
            color="#FF9800"
            style={{ marginRight: 6 }}
          />
          <Text className="text-base font-bold text-black">{address.label}</Text>
          {selected ? (
            <Ionicons name="checkmark-circle" size={18} color="#FF9800" style={{ marginLeft: 6 }} />
          ) : null}
        </TouchableOpacity>
        <TouchableOpacity onPress={onEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text className="text-[#FF9800] text-sm font-semibold">Edit</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        <Text className="text-[#4B5563] text-sm leading-5">{address.street}</Text>
        <Text className="text-[#4B5563] text-sm leading-5">
          {address.city}, {address.state} {address.zipCode}
        </Text>
        <Text className="text-[#4B5563] text-sm leading-5 mt-1">{address.phone}</Text>
      </TouchableOpacity>
    </View>
  );
}
