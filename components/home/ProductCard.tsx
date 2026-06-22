import WishlistHeartButton from "@/components/WishlistHeartButton";
import { toWishlistItem } from "@/contexts/WishlistContext";
import type { Product } from "@/types/home";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type ProductCardProps = {
  product: Product;
  showBrand?: boolean;
};

export default function ProductCard({
  product,
  showBrand = false,
}: ProductCardProps) {
  const router = useRouter();

  const openProductDetail = () => {
    router.push({ pathname: "/product/[id]", params: { id: product.id } });
  };

  return (
    <View className="bg-white rounded-2xl border border-[#F0F0F0] overflow-hidden mb-3">
      <TouchableOpacity onPress={openProductDetail} activeOpacity={0.85}>
        <View className="relative">
          <Image
            source={{ uri: product.image }}
            style={{ width: "100%", height: 120 }}
            contentFit="cover"
          />
          {product.isNew ? (
            <View className="absolute top-2 left-2 bg-[#22C55E] rounded-full px-2 py-0.5">
              <Text className="text-white text-[10px] font-bold">NEW</Text>
            </View>
          ) : null}
          {product.discount ? (
            <View className="absolute top-2 right-2 bg-[#E53935] rounded-full px-2 py-0.5">
              <Text className="text-white text-[10px] font-bold">
                -{product.discount}%
              </Text>
            </View>
          ) : null}
        </View>

        <View className="p-2.5">
          <Text className="text-[13px] font-semibold text-black" numberOfLines={2}>
            {product.name}
          </Text>
          {showBrand && product.brand ? (
            <Text className="text-[#FF9800] text-[11px] mt-0.5">{product.brand}</Text>
          ) : null}
          <View className="flex-row items-center mt-1">
            <Ionicons name="star" size={12} color="#FBBF24" />
            <Text className="text-[11px] text-[#6B7280] ml-1">
              {product.rating} ({product.reviewCount})
            </Text>
          </View>
          <View className="flex-row items-center mt-1 flex-wrap">
            <Text className="text-[#FF9800] text-sm font-bold">
              ${product.price.toFixed(2)}
            </Text>
            {product.originalPrice ? (
              <Text className="text-[#9CA3AF] text-[11px] line-through ml-1.5">
                ${product.originalPrice.toFixed(2)}
              </Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>

      <View className="absolute bottom-2 right-2">
        <WishlistHeartButton item={toWishlistItem(product)} />
      </View>
    </View>
  );
}
