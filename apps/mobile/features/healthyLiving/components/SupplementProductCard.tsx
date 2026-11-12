import WishlistHeartButton from "@/features/wishlist/components/WishlistHeartButton";
import { useCart } from "@/features/cart/contexts/CartContext";
import { useCurrency } from "@/shared/contexts/CurrencyContext";
import { toWishlistItem } from "@/features/wishlist/contexts/WishlistContext";
import { getProductById } from "@/features/products/services/productService";
import type { CatalogProduct } from "@/features/healthyLiving/types/healthyLivingCatalog";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";

type SupplementProductCardProps = {
  product: CatalogProduct;
};

function StarRowWithCount({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  return (
    <View className="flex-row items-center">
      {Array.from({ length: 5 }).map((_, index) => (
        <Ionicons
          key={index}
          name={index < Math.round(rating) ? "star" : "star-outline"}
          size={12}
          color="#FBBF24"
        />
      ))}
      <Text className="text-[11px] text-[#6B7280] ml-1">({reviewCount})</Text>
    </View>
  );
}

export default function SupplementProductCard({ product }: SupplementProductCardProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const { formatPrice } = useCurrency();

  const openProductDetail = () => {
    router.push({ pathname: "/product/[id]", params: { id: product.id } });
  };

  const handleAddToCart = async () => {
    const detail = await getProductById(product.id);
    if (!detail) {
      Alert.alert("Error", "Could not add this product to cart.");
      return;
    }
    addItem(detail);
    Alert.alert("Added to cart", `${product.name} has been added to your cart.`);
  };

  return (
    <View
      className="bg-white rounded-2xl border border-[#F0F0F0] overflow-hidden mb-3"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      <TouchableOpacity onPress={openProductDetail} activeOpacity={0.85}>
        <View className="relative">
          <Image
            source={{ uri: product.image }}
            style={{ width: "100%", height: 130 }}
            contentFit="cover"
          />
          <View className="absolute top-2 right-2">
            <WishlistHeartButton
              item={toWishlistItem({
                id: product.id,
                name: product.name,
                image: product.image,
                price: product.price,
              })}
            />
          </View>
        </View>

        <View className="p-3 pb-12">
          <Text className="text-[14px] font-bold text-black" numberOfLines={1}>
            {product.name}
          </Text>
          <View className="mt-1">
            <StarRowWithCount rating={product.rating} reviewCount={product.reviewCount} />
          </View>
          <Text className="text-[12px] text-[#6B7280] mt-1.5 leading-4" numberOfLines={2}>
            {product.description}
          </Text>
          <Text className="text-[#FF9800] text-[18px] font-bold mt-2">
            {formatPrice(product.price)}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleAddToCart}
        className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-[#FF9800] justify-center items-center"
        activeOpacity={0.85}
      >
        <Ionicons name="cart-outline" size={18} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}
