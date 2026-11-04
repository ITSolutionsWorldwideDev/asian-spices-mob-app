import WishlistHeartButton from "@/components/WishlistHeartButton";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { toWishlistItem } from "@/contexts/WishlistContext";
import type { CategoryProduct } from "@/types/category";
import type { ProductDetail } from "@/types/product";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

type ProductListCardProps = {
  product: CategoryProduct;
  onPress?: () => void;
};

export default function ProductListCard({ product, onPress }: ProductListCardProps) {
  const { formatPrice } = useCurrency();
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const handleAddToCart = (e?: { stopPropagation?: () => void }) => {
    e?.stopPropagation?.();
    const cartProduct: ProductDetail = {
      id: product.id,
      name: product.name,
      image: product.image,
      price: product.price,
      originalPrice: product.originalPrice,
      discountPercent: product.discountPercent,
      discountType: product.discountType,
      discount: product.discount,
      weight: product.weight ?? "",
      brand: product.brandId ?? "",
      description: product.description ?? "",
      inStock: true,
      rating: product.rating,
      reviewCount: product.reviewCount,
      reviews: [],
    };
    addItem(cartProduct, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <View className="flex-1 bg-white rounded-2xl border border-[#EAEAEA] overflow-hidden mb-3">
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} className="flex-1 justify-between">
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

        <View className="px-3 pt-2 pb-2.5 flex-1 justify-between">
          <View>
            <Text className="text-[13px] font-semibold text-black leading-[18px]">
              {product.name}
            </Text>
            {product.weight &&
            !product.name.toLowerCase().includes(product.weight.toLowerCase()) ? (
              <Text className="text-[#6B7280] text-[11px] font-medium mt-0.5">
                {product.weight}
              </Text>
            ) : null}
            <View className="flex-row items-center mt-1">
              <Ionicons name="star" size={12} color="#FBBF24" />
              <Text className="text-[#6B7280] text-[11px] ml-1">
                {product.rating}({product.reviewCount})
              </Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between mt-2 pt-1">
            <View className="flex-1 mr-2">
              <Text className="text-[#FF5A1F] text-[16px] font-bold">
                {formatPrice(product.price)}
              </Text>
              {product.originalPrice && product.originalPrice > product.price ? (
                <Text className="text-[#9CA3AF] text-[11px] line-through -mt-0.5">
                  {formatPrice(product.originalPrice)}
                </Text>
              ) : null}
            </View>

            <TouchableOpacity
              onPress={handleAddToCart}
              activeOpacity={0.8}
              className={`w-8 h-8 rounded-full items-center justify-center ${
                added ? "bg-[#22C55E]" : "bg-[#FF9800]"
              }`}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons
                name={added ? "checkmark" : "cart-outline"}
                size={16}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}
