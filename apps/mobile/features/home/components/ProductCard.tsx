import WishlistHeartButton from "@/features/wishlist/components/WishlistHeartButton";
import { useCart } from "@/features/cart/contexts/CartContext";
import { useCurrency } from "@/shared/providers/CurrencyProvider";
import { toWishlistItem } from "@/features/wishlist/contexts/WishlistContext";
import type { Product } from "@/features/home/types/home";
import type { ProductDetail } from "@/features/products/types/product";
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

const IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80";

export default function ProductCard({
  product,
  showBrand = false,
  showOriginalPrice = false,
}: ProductCardProps) {
  const router = useRouter();
  const { formatPrice } = useCurrency();
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const safePrice = Number.isFinite(Number(product.price)) ? Number(product.price) : 0;
  const safeOriginal =
    product.originalPrice != null && Number.isFinite(Number(product.originalPrice))
      ? Number(product.originalPrice)
      : undefined;
  const imageUri =
    typeof product.image === "string" && product.image.trim().length > 0
      ? product.image
      : IMAGE_FALLBACK;

  const openProductDetail = () => {
    router.push({ pathname: "/product/[id]", params: { id: String(product.id) } });
  };

  const handleAddToCart = (e?: { stopPropagation?: () => void }) => {
    e?.stopPropagation?.();
    const cartProduct: ProductDetail = {
      id: String(product.id),
      name: product.name || "Product",
      image: imageUri,
      price: safePrice,
      originalPrice: safeOriginal,
      discountPercent: typeof product.discount === "number" ? product.discount : undefined,
      discountType: product.discountType,
      discount: product.discount,
      weight: "",
      brand: product.brand ?? "",
      description: "",
      inStock: true,
      rating: Number(product.rating) || 0,
      reviewCount: Number(product.reviewCount) || 0,
      reviews: [],
    };
    addItem(cartProduct, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  // Avoid flex-1 inside ScrollView — it can collapse cards to thin border lines.
  return (
    <View className="bg-white rounded-2xl border border-[#F0F0F0] overflow-hidden mb-3">
      <TouchableOpacity onPress={openProductDetail} activeOpacity={0.85}>
        <View className="relative">
          <Image
            source={{ uri: imageUri }}
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
                  ? `-${formatPrice(Number(product.discount) || 0)}`
                  : `-${product.discount}%`}
              </Text>
            </View>
          ) : null}
          <View className="absolute top-2 right-2">
            <WishlistHeartButton item={toWishlistItem({ ...product, image: imageUri, price: safePrice })} />
          </View>
        </View>

        <View className="p-2.5">
          <Text className="text-[13px] font-semibold text-black leading-[18px]" numberOfLines={2}>
            {product.name || "Product"}
          </Text>
          {showBrand && product.brand ? (
            <Text className="text-[#FF9800] text-[11px] mt-0.5">{product.brand}</Text>
          ) : null}
          <View className="h-[18px] flex-row items-center mt-1">
            {Number(product.reviewCount) > 0 ? (
              <>
                <Ionicons name="star" size={12} color="#FBBF24" />
                <Text className="text-[11px] text-[#6B7280] ml-1">
                  {(Number(product.rating) || 0).toFixed(1)} ({product.reviewCount})
                </Text>
              </>
            ) : null}
          </View>

          <View className="flex-row items-center justify-between mt-2 pt-1">
            <View className="flex-row items-center flex-wrap mr-2" style={{ flexShrink: 1 }}>
              <Text className="text-[#FF9800] text-sm font-bold">
                {formatPrice(safePrice)}
              </Text>
              {showOriginalPrice &&
              safeOriginal != null &&
              safeOriginal > safePrice ? (
                <Text className="text-[#9CA3AF] text-[11px] line-through ml-1.5">
                  {formatPrice(safeOriginal)}
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
