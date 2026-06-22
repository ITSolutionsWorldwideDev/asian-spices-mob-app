import AppHeader from "@/components/AppHeader";
import AppTabBar from "@/components/AppTabBar";
import { useCart } from "@/contexts/CartContext";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function OrderSuccessScreen() {
  const router = useRouter();
  const { clearCart } = useCart();
  const { orderNumber, deliveryDate, orderId } = useLocalSearchParams<{
    orderNumber: string;
    deliveryDate: string;
    orderId: string;
  }>();

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <View className="flex-1 bg-[#FFFBF5]">
      <AppHeader searchPlaceholder="Search spices, recipes..." />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 32,
          paddingBottom: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center mb-8">
          <View className="relative mb-6">
            <View className="w-28 h-28 rounded-full bg-[#D1FAE5] justify-center items-center">
              <View className="w-20 h-20 rounded-full bg-[#22C55E] justify-center items-center">
                <Ionicons name="checkmark" size={44} color="#FFFFFF" />
              </View>
            </View>
            <View className="absolute -top-1 -right-1 w-9 h-9 rounded-full bg-[#FF9800] justify-center items-center">
              <Text style={{ fontSize: 18 }}>🎉</Text>
            </View>
          </View>

          <Text className="text-[26px] font-bold text-[#1F2937] text-center">
            Order Placed Successfully!
          </Text>
          <Text className="text-[#6B7280] text-[15px] text-center mt-3 leading-6 px-4">
            Thank you for your order. We&apos;ll send you a confirmation email shortly.
          </Text>
        </View>

        <View
          className="bg-white rounded-2xl p-5 mb-6"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-[#9CA3AF] text-sm">Order Number</Text>
              <Text className="text-[#111827] text-lg font-bold mt-1">
                {orderNumber}
              </Text>
            </View>
            <View className="w-11 h-11 rounded-xl bg-[#FFF7ED] justify-center items-center">
              <Ionicons name="cube-outline" size={24} color="#FF9800" />
            </View>
          </View>

          <View className="h-px bg-[#F3F4F6] mb-4" />

          <View className="flex-row items-center mb-4">
            <View className="w-10 h-10 rounded-full bg-[#FEF3C7] justify-center items-center mr-3">
              <Text style={{ fontSize: 18 }}>📦</Text>
            </View>
            <View className="flex-1">
              <Text className="text-[#111827] text-base font-semibold">Order Confirmed</Text>
              <Text className="text-[#9CA3AF] text-sm mt-0.5">Your order has been placed</Text>
            </View>
            <View className="w-6 h-6 rounded-full bg-[#22C55E] justify-center items-center">
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            </View>
          </View>

          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-[#F3F4F6] justify-center items-center mr-3">
              <Text style={{ fontSize: 18 }}>🚚</Text>
            </View>
            <View className="flex-1">
              <Text className="text-[#111827] text-base font-semibold">Estimated Delivery</Text>
              <Text className="text-[#FF9800] text-sm font-semibold mt-0.5">
                {deliveryDate}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => {
            if (orderId) {
              router.replace({ pathname: "/track-order/[id]", params: { id: orderId } });
            } else {
              router.replace("/my-orders");
            }
          }}
          className="bg-[#FF9800] rounded-xl py-4 items-center mb-3"
          activeOpacity={0.85}
        >
          <Text className="text-white text-base font-semibold">Track My Order</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace("/(tabs)")}
          className="bg-white border border-[#E5E7EB] rounded-xl py-4 flex-row justify-center items-center"
          activeOpacity={0.85}
        >
          <Ionicons name="home-outline" size={20} color="#374151" />
          <Text className="text-[#374151] text-base font-semibold ml-2">
            Continue Shopping
          </Text>
        </TouchableOpacity>
      </ScrollView>
      <AppTabBar />
    </View>
  );
}
