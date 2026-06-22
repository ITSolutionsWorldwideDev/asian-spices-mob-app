import SuccessPopup from "@/components/SuccessPopup";
import { useCart } from "@/contexts/CartContext";
import { toWishlistItem, useWishlist } from "@/contexts/WishlistContext";
import { getProductById } from "@/services/productService";
import type { ProductDetail } from "@/types/product";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <View className="flex-row items-center">
      {Array.from({ length: 5 }).map((_, index) => (
        <Ionicons
          key={index}
          name={index < Math.round(rating) ? "star" : "star-outline"}
          size={size}
          color="#FBBF24"
        />
      ))}
    </View>
  );
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addItem } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [showAddedPopup, setShowAddedPopup] = useState(false);

  const handleAddToCart = () => {
    addItem(product!, quantity);
    setShowAddedPopup(true);
  };

  const handleDismissPopup = useCallback(() => {
    setShowAddedPopup(false);
  }, []);

  const handlePopupOk = useCallback(() => {
    setShowAddedPopup(false);
    router.back();
  }, [router]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    getProductById(id)
      .then(setProduct)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#FF9800" />
      </View>
    );
  }

  if (!product) {
    return (
      <View className="flex-1 bg-white justify-center items-center px-8">
        <Text className="text-[#9CA3AF] text-center mb-4">Product not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-[#FF9800] font-medium">Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View
        className="bg-white border-b border-[#EAEAEA]"
        style={{ paddingTop: insets.top + 8, paddingBottom: 12 }}
      >
        <View className="flex-row items-center px-4">
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-9 h-9 justify-center items-center"
          >
            <Ionicons name="chevron-back" size={26} color="#333333" />
          </TouchableOpacity>
          <Text className="flex-1 text-center text-[18px] font-bold text-black mr-9">
            Product Details
          </Text>
          <TouchableOpacity
            onPress={() => product && toggleWishlist(toWishlistItem(product))}
            className="absolute right-4 w-9 h-9 justify-center items-center"
            activeOpacity={0.8}
          >
            <Ionicons
              name={isWishlisted(product.id) ? "heart" : "heart-outline"}
              size={22}
              color={isWishlisted(product.id) ? "#EF4444" : "#333333"}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="relative mx-4 mt-4 rounded-2xl overflow-hidden">
          <Image
            source={{ uri: product.image }}
            style={{ width: "100%", height: 280 }}
            contentFit="cover"
          />
          {product.discountPercent ? (
            <View className="absolute top-3 right-3 bg-[#FF3B30] rounded-lg px-2.5 py-1">
              <Text className="text-white text-xs font-bold">
                -{product.discountPercent}% OFF
              </Text>
            </View>
          ) : null}
        </View>

        <View className="px-4 mt-4">
          <View className="flex-row items-start justify-between gap-2">
            <Text className="flex-1 text-[22px] font-bold text-black leading-7">
              {product.name}
            </Text>
            {product.inStock ? (
              <View className="bg-[#22C55E] rounded-full px-2.5 py-1">
                <Text className="text-white text-[11px] font-semibold">In Stock</Text>
              </View>
            ) : null}
          </View>

          <Text className="text-[#9CA3AF] text-sm mt-1">{product.weight}</Text>
          <Text className="text-[#FF9800] text-sm mt-1 font-medium">
            Brand: {product.brand}
          </Text>

          <View className="flex-row items-center mt-2">
            <StarRow rating={product.rating} />
            <Text className="text-[#6B7280] text-sm ml-2">
              {product.rating} ({product.reviewCount} reviews)
            </Text>
          </View>

          <View className="flex-row items-center mt-2">
            <Text className="text-[#FF9800] text-[28px] font-bold">
              ${product.price.toFixed(2)}
            </Text>
            {product.originalPrice ? (
              <Text className="text-[#9CA3AF] text-base line-through ml-2">
                ${product.originalPrice.toFixed(2)}
              </Text>
            ) : null}
          </View>

          <Text className="text-black text-base font-bold mt-5">Description</Text>
          <Text className="text-[#6B7280] text-sm mt-2 leading-5">
            {product.description}
          </Text>

          <Text className="text-black text-base font-bold mt-5">Quantity</Text>
          <View className="flex-row items-center mt-3">
            <TouchableOpacity
              onPress={() => setQuantity((value) => Math.max(1, value - 1))}
              className="w-9 h-9 rounded-full border border-[#E5E7EB] justify-center items-center"
              activeOpacity={0.8}
            >
              <Ionicons name="remove" size={18} color="#333333" />
            </TouchableOpacity>
            <Text className="mx-5 text-lg font-semibold text-black">{quantity}</Text>
            <TouchableOpacity
              onPress={() => setQuantity((value) => value + 1)}
              className="w-9 h-9 rounded-full border border-[#E5E7EB] justify-center items-center"
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={18} color="#333333" />
            </TouchableOpacity>
          </View>

          <Text className="text-black text-base font-bold mt-5">Customer Reviews</Text>
          {product.reviews.map((review) => (
            <View key={review.id} className="mt-3">
              <View className="flex-row items-center">
                <Text className="text-black text-sm font-semibold">{review.author}</Text>
                <View className="ml-2">
                  <StarRow rating={review.rating} size={12} />
                </View>
              </View>
              <Text className="text-[#6B7280] text-sm mt-1 leading-5">{review.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View
        className="bg-white border-t border-[#EAEAEA] px-4 pt-3 flex-row gap-3"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <TouchableOpacity
          onPress={handleAddToCart}
          className="flex-1 bg-[#FF9800] rounded-xl py-3.5 flex-row justify-center items-center"
          activeOpacity={0.85}
        >
          <Ionicons name="cart-outline" size={20} color="#FFFFFF" />
          <Text className="text-white text-base font-semibold ml-2">Add to Cart</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 bg-[#1F2937] rounded-xl py-3.5 justify-center items-center"
          activeOpacity={0.85}
        >
          <Text className="text-white text-base font-semibold">Buy Now</Text>
        </TouchableOpacity>
      </View>

      <SuccessPopup
        visible={showAddedPopup}
        message="Added to cart successfully"
        onClose={handleDismissPopup}
        onOk={handlePopupOk}
      />
    </View>
  );
}
