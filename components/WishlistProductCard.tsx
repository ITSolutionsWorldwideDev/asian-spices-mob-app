import type { WishlistItem } from "@/types/wishlist";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type WishlistProductCardProps = {
  item: WishlistItem;
  onRemove: () => void;
};

export default function WishlistProductCard({ item, onRemove }: WishlistProductCardProps) {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() =>
        router.push({ pathname: "/product/[id]", params: { id: item.id } })
      }
      activeOpacity={0.85}
      className="flex-1 bg-white rounded-2xl border border-[#EAEAEA] overflow-hidden mb-3"
    >
      <View className="relative h-[140px]">
        <Image
          source={{ uri: item.image }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
        <TouchableOpacity
          onPress={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white justify-center items-center"
          activeOpacity={0.8}
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
          }}
        >
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <View className="px-3 py-2.5">
        <Text className="text-[15px] font-semibold text-black" numberOfLines={2}>
          {item.name}
        </Text>
        <View className="flex-row items-center mt-1.5 flex-wrap">
          <Text className="text-[#FF9800] text-base font-bold">
            ${item.price.toFixed(2)}
          </Text>
          {item.originalPrice ? (
            <Text className="text-[#9CA3AF] text-sm line-through ml-1.5">
              ${item.originalPrice.toFixed(2)}
            </Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}
