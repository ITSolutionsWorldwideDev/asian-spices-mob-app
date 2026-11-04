import WishlistHeartButton from "@/components/WishlistHeartButton";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { toWishlistItem } from "@/contexts/WishlistContext";
import type { Product } from "@/types/home";
import type { ProductDetail } from "@/types/product";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

type ProductCardProps = {
  product: Product;
  showBrand?: boolean;
  showOriginalPrice?: boolean;
};

export default function ProductCard({
  product,
  showBrand = false,
  showOriginalPrice = false,
}: ProductCardProps) {
  const router = useRouter();
  const { formatPrice } = useCurrency();
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const openProductDetail = () => {
    router.push({ pathname: "/product/[id]", params: { id: product.id } });
  };

  const handleAddToCart = (e?: { stopPropagation?: () => void }) => {
    e?.stopPropagation?.();
    const cartProduct: ProductDetail = {
      id: product.id,
      name: product.name,
      image: product.image,
      price: product.price,
      originalPrice: product.originalPrice,
      discountPercent: typeof product.discount === "number" ? product.discount : undefined,
      discountType: product.discountType,
      discount: product.discount,
      weight: "",
      brand: product.brand ?? "",
      description: "",
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
    <View className="flex-1 bg-white rounded-2xl border border-[#F0F0F0] overflow-hidden mb-3">
      <TouchableOpacity onPress={openProductDetail} activeOpacity={0.85} className="flex-1 justify-between">
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
            <View
              className={`absolute left-2 bg-[#E53935] rounded-full px-2 py-0.5 ${
                product.isNew ? "top-7" : "top-2"
              }`}
            >
              <Text className="text-white text-[10px] font-bold">
                {product.discountType === "fixed"
                  ? `-${formatPrice(product.discount)}`
                  : `-${product.discount}%`}
              </Text>
            </View>
          ) : null}
          <View className="absolute top-2 right-2">
            <WishlistHeartButton item={toWishlistItem(product)} />
          </View>
        </View>

        <View className="p-2.5 flex-1 justify-between">
          <View>
            <Text className="text-[13px] font-semibold text-black leading-[18px]">
              {product.name}
            </Text>
            {showBrand && product.brand ? (
              <Text className="text-[#FF9800] text-[11px] mt-0.5">{product.brand}</Text>
            ) : null}
            <View className="h-[18px] flex-row items-center mt-1">
              {product.reviewCount > 0 ? (
                <>
                  <Ionicons name="star" size={12} color="#FBBF24" />
                  <Text className="text-[11px] text-[#6B7280] ml-1">
                    {product.rating.toFixed(1)} ({product.reviewCount})
                  </Text>
                </>
              ) : null}
            </View>
          </View>

          <View className="flex-row items-center justify-between mt-2 pt-1">
            <View className="flex-row items-center flex-wrap flex-1 mr-2">
              <Text className="text-[#FF9800] text-sm font-bold">
                {formatPrice(product.price)}
              </Text>
              {showOriginalPrice &&
              product.originalPrice &&
              product.originalPrice > product.price ? (
                <Text className="text-[#9CA3AF] text-[11px] line-through ml-1.5">
                  {formatPrice(product.originalPrice)}
                </Text>
              ) : null}
            </View>

            <TouchableOpacity
              onPress={handleAddToCart}
              activeOpacity={0.8}
              className={`w-7 h-7 rounded-full items-center justify-center ${
                added ? "bg-[#22C55E]" : "bg-[#FF9800]"
              }`}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons
                name={added ? "checkmark" : "cart-outline"}
                size={14}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}
