import type { DeliveryAddress } from "@/types/address";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type AddressCardProps = {
  address: DeliveryAddress;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault?: () => void;
};

export default function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
}: AddressCardProps) {
  return (
    <View
      className="bg-white rounded-2xl border border-[#EAEAEA] p-4 mb-4"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center flex-1">
          <Ionicons name="location" size={20} color="#FF9800" style={{ marginRight: 8 }} />
          <Text className="text-[16px] font-bold text-black">{address.label}</Text>
          {address.isDefault ? (
            <View className="bg-[#FFF3E0] rounded-full px-2.5 py-0.5 ml-2">
              <Text className="text-[#FF9800] text-[11px] font-semibold">Default</Text>
            </View>
          ) : null}
        </View>
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={onEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="pencil" size={20} color="#FF9800" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="trash-outline" size={20} color="#FF9800" />
          </TouchableOpacity>
        </View>
      </View>

      {address.fullName ? (
        <Text className="text-[15px] text-black mb-1">{address.fullName}</Text>
      ) : null}
      <Text className="text-[14px] text-[#4B5563] leading-5">{address.street}</Text>
      <Text className="text-[14px] text-[#4B5563] leading-5">
        {address.city}, {address.state} {address.zipCode}
      </Text>
      <Text className="text-[14px] text-[#4B5563] leading-5 mt-1">{address.phone}</Text>

      {!address.isDefault && onSetDefault ? (
        <TouchableOpacity
          onPress={onSetDefault}
          className="mt-4 border border-[#FF9800] rounded-xl py-3 items-center"
          activeOpacity={0.85}
        >
          <Text className="text-[#FF9800] text-[14px] font-semibold">Set as Default</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
