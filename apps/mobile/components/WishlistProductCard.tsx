import { useCurrency } from "@/contexts/CurrencyContext";
import type { WishlistItem } from "@/types/wishlist";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type WishlistProductCardProps = {
  item: WishlistItem;
  onRemove: () => void;
  onAddToCart: () => void;
};

export default function WishlistProductCard({
  item,
  onRemove,
  onAddToCart,
}: WishlistProductCardProps) {
  const router = useRouter();
  const { formatPrice } = useCurrency();

  return (
    <View className="flex-1 flex-col bg-white rounded-2xl border border-[#EAEAEA] overflow-hidden mb-3 self-stretch">
      <TouchableOpacity
        onPress={() =>
          router.push({ pathname: "/product/[id]", params: { id: item.id } })
        }
        activeOpacity={0.85}
        className="flex-1"
      >
        <View className="relative h-[140px]">
          <Image
            source={{ uri: item.image }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
          <TouchableOpacity
            onPress={onRemove}
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

        <View className="px-3 pt-2.5 pb-2">
          <Text
            className="text-[15px] font-semibold text-black"
            numberOfLines={2}
            style={{ minHeight: 40, lineHeight: 20 }}
          >
            {item.name}
          </Text>
          <View className="flex-row items-center mt-1.5 h-[22px]">
            <Text className="text-[#FF9800] text-base font-bold">
              {formatPrice(item.price)}
            </Text>
            {item.originalPrice ? (
              <Text className="text-[#9CA3AF] text-sm line-through ml-1.5">
                {formatPrice(item.originalPrice)}
              </Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onAddToCart}
        className="mx-3 mb-3 rounded-lg py-2 justify-center items-center bg-[#FF9800]"
        activeOpacity={0.85}
      >
        <Text className="text-white text-[12px] font-semibold">Add to Cart</Text>
      </TouchableOpacity>
    </View>
  );
}
