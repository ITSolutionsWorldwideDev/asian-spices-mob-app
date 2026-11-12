import type { DeliveryAddress } from "@/features/profile/types/address";
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
        {(address.fullName || address.firstName) ? (
          <View className="flex-row items-center mb-1">
            <Ionicons name="person-outline" size={14} color="#6B7280" style={{ marginRight: 4 }} />
            <Text className="text-[#111827] text-sm font-semibold">
              {address.fullName || `${address.firstName ?? ""} ${address.lastName ?? ""}`.trim()}
            </Text>
          </View>
        ) : null}
        <Text className="text-[#4B5563] text-sm leading-5">{address.street}</Text>
        {address.apartment ? (
          <View className="flex-row items-center my-0.5">
            <Text className="text-[#D97706] text-[11px] font-semibold bg-[#FEF3C7] px-1.5 py-0.5 rounded mr-1.5">
              Apt / Line 2
            </Text>
            <Text className="text-[#374151] text-sm leading-5 font-medium">{address.apartment}</Text>
          </View>
        ) : null}
        <Text className="text-[#4B5563] text-sm leading-5">
          {address.city}, {address.state ? `${address.state} ` : ""}{address.zipCode}
        </Text>
        {address.country ? (
          <Text className="text-[#6B7280] text-xs leading-4 mt-0.5">{address.country}</Text>
        ) : null}
        {address.phone ? (
          <View className="flex-row items-center mt-1">
            <Ionicons name="call-outline" size={13} color="#6B7280" style={{ marginRight: 4 }} />
            <Text className="text-[#4B5563] text-xs">{address.phone}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
    </View>
  );
}
