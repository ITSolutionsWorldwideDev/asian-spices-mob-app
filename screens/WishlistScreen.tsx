import AppTabBar from "@/components/AppTabBar";
import WishlistProductCard from "@/components/WishlistProductCard";
import { useWishlist } from "@/contexts/WishlistContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function WishlistScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items, removeFromWishlist } = useWishlist();

  const isEmpty = items.length === 0;

  return (
    <View className="flex-1 bg-[#F5F5F5]">
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
            Wishlist
          </Text>
        </View>
      </View>

      {isEmpty ? (
        <View className="flex-1 justify-center items-center px-8">
          <View className="w-24 h-24 rounded-full bg-[#F3F4F6] justify-center items-center mb-6">
            <Ionicons name="heart-outline" size={48} color="#D1D5DB" />
          </View>
          <Text className="text-[22px] font-bold text-black text-center">
            Your wishlist is empty
          </Text>
          <Text className="text-[#9CA3AF] text-base text-center mt-2 leading-6">
            Save your favorite items here!
          </Text>
          <TouchableOpacity
            onPress={() => router.replace("/(tabs)")}
            className="bg-[#FF9800] rounded-full px-8 py-3.5 mt-8"
            activeOpacity={0.85}
          >
            <Text className="text-white text-base font-semibold">Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <WishlistProductCard
              item={item}
              onRemove={() => removeFromWishlist(item.id)}
            />
          )}
        />
      )}

      <AppTabBar />
    </View>
  );
}
