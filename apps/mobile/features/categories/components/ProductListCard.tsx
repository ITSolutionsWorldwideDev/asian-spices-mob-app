import WishlistHeartButton from "@/features/wishlist/components/WishlistHeartButton";
import { useCurrency } from "@/shared/contexts/CurrencyContext";
import { toWishlistItem } from "@/features/wishlist/contexts/WishlistContext";
import type { CategoryProduct } from "@/features/categories/types/category";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type ProductListCardProps = {
  product: CategoryProduct;
  onPress?: () => void;
};

export default function ProductListCard({ product, onPress }: ProductListCardProps) {
  const { formatPrice } = useCurrency();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="flex-1 bg-white rounded-2xl border border-[#EAEAEA] overflow-hidden mb-3"
    >
      <View className="relative h-[160px]">
        <Image
          source={{ uri: product.image }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
        {product.discountType === "fixed" && product.discount ? (
          <View className="absolute top-2 left-2 bg-[#FF3B30] rounded-full px-2 py-1">
            <Text className="text-white text-[11px] font-bold">
              -{formatPrice(product.discount)}
            </Text>
          </View>
        ) : product.discountPercent ? (
          <View className="absolute top-2 left-2 bg-[#FF3B30] rounded-full px-2 py-1">
            <Text className="text-white text-[11px] font-bold">
              {product.discountPercent}% OFF
            </Text>
          </View>
        ) : null}
        <View className="absolute top-2 right-2">
          <WishlistHeartButton item={toWishlistItem(product)} />
        </View>
      </View>

      <View className="px-3 py-2.5">
        <Text className="text-[16px] font-semibold text-black" numberOfLines={1}>
          {product.name}
        </Text>
        <View className="flex-row items-center mt-1">
          <Ionicons name="star" size={13} color="#FBBF24" />
          <Text className="text-[#6B7280] text-[13px] ml-1">
            {product.rating}({product.reviewCount})
          </Text>
        </View>
        <View className="flex-row items-center mt-1">
          <Text className="text-[#FF5A1F] text-[28px] font-bold leading-[32px]">
            {formatPrice(product.price)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
