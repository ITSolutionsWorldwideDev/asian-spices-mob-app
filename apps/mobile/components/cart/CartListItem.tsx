import { useCurrency } from "@/contexts/CurrencyContext";
import type { CartItem } from "@/types/cart";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type CartListItemProps = {
  item: CartItem;
  vatPercent?: number | null;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
};

export default function CartListItem({
  item,
  vatPercent = null,
  onIncrease,
  onDecrease,
  onRemove,
}: CartListItemProps) {
  const { formatPrice } = useCurrency();
  const lineTotal = item.price * item.quantity;

  return (
    <View className="py-4 border-b border-[#EAEAEA]">
      <View className="flex-row gap-3">
        <Image
          source={{ uri: item.image }}
          style={{ width: 80, height: 80, borderRadius: 12 }}
          contentFit="cover"
        />

        <View className="flex-1">
          <View className="flex-row items-start justify-between gap-2">
            <View className="flex-1">
              <Text className="text-[16px] font-bold text-black" numberOfLines={2}>
                {item.name}
              </Text>
              {vatPercent != null ? (
                <Text className="text-[#6B7280] text-xs mt-0.5">
                  Included {vatPercent}%
                </Text>
              ) : null}
              {item.weight ? (
                <Text className="text-[#9CA3AF] text-sm mt-0.5">{item.weight}</Text>
              ) : null}
            </View>
            <View className="items-end">
              <Text className="text-[#FF9800] text-lg font-bold">
                Total (incl Tax): {formatPrice(lineTotal)}
              </Text>
              <Text className="text-[#9CA3AF] text-xs mt-0.5">
                {formatPrice(item.price)} each
              </Text>
            </View>
          </View>

          <View className="flex-row items-center mt-3">
            <View className="flex-row items-center border border-[#E5E7EB] rounded-full px-1">
              <TouchableOpacity
                onPress={onDecrease}
                className="w-8 h-8 justify-center items-center"
                activeOpacity={0.8}
              >
                <Ionicons name="remove" size={16} color="#333333" />
              </TouchableOpacity>
              <Text className="mx-3 text-base font-semibold text-black">
                {item.quantity}
              </Text>
              <TouchableOpacity
                onPress={onIncrease}
                className="w-8 h-8 justify-center items-center"
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={16} color="#333333" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={onRemove}
              className="ml-3 w-9 h-9 justify-center items-center"
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}
