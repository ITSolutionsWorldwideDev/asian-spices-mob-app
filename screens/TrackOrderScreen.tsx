import AppHeader from "@/components/AppHeader";
import AppTabBar from "@/components/AppTabBar";
import OrderTimeline from "@/components/OrderTimeline";
import { getOrderById, getOrderTimeline } from "@/services/orderService";
import type { Order } from "@/types/order";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";

const DEFAULT_ADDRESS = "123 Main Street, Apt 4B, New York, NY 10001";

export default function TrackOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    getOrderById(id)
      .then(setOrder)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const timeline = useMemo(
    () => (order ? getOrderTimeline(order) : []),
    [order]
  );

  if (loading) {
    return (
      <View className="flex-1 bg-[#F5F5F5]">
        <AppHeader searchPlaceholder="Search spices, recipes..." />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#FF9800" />
        </View>
        <AppTabBar />
      </View>
    );
  }

  if (!order) {
    return (
      <View className="flex-1 bg-[#F5F5F5]">
        <AppHeader searchPlaceholder="Search spices, recipes..." />
        <View className="flex-1 justify-center items-center px-8">
          <Text className="text-[#9CA3AF] text-center mb-4">Order not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-[#FF9800] font-medium">Go back</Text>
          </TouchableOpacity>
        </View>
        <AppTabBar />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <AppHeader searchPlaceholder="Search spices, recipes..." />

      <View className="bg-white border-b border-[#EAEAEA] py-3">
        <View className="flex-row items-center px-4">
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-9 h-9 justify-center items-center"
          >
            <Ionicons name="chevron-back" size={26} color="#333333" />
          </TouchableOpacity>
          <Text className="flex-1 text-center text-[18px] font-bold text-black mr-9">
            Track Order
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="bg-white rounded-2xl border border-[#EAEAEA] p-4 mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-[#9CA3AF] text-sm">Order ID</Text>
              <Text className="text-[#111827] text-lg font-bold mt-1">
                #{order.orderNumber}
              </Text>
            </View>
            <View className="w-11 h-11 rounded-xl bg-[#FFF7ED] justify-center items-center">
              <Ionicons name="car-outline" size={24} color="#FF9800" />
            </View>
          </View>

          <View className="bg-[#FFF7ED] rounded-xl p-4 mb-4">
            <View className="flex-row items-center mb-1">
              <Ionicons name="cube-outline" size={18} color="#FF9800" />
              <Text className="text-[#9CA3AF] text-sm ml-2">Tracking Number</Text>
            </View>
            <Text className="text-[#C2410C] text-base font-bold mt-1">
              {order.trackingNumber}
            </Text>
          </View>

          <View className="mb-4">
            <View className="flex-row items-center mb-1">
              <Ionicons name="location-outline" size={18} color="#9CA3AF" />
              <Text className="text-[#9CA3AF] text-sm ml-2">Delivery Address</Text>
            </View>
            <Text className="text-[#374151] text-sm mt-1 leading-5">
              {order.deliveryAddress || DEFAULT_ADDRESS}
            </Text>
          </View>

          <View>
            <View className="flex-row items-center mb-1">
              <Ionicons name="time-outline" size={18} color="#22C55E" />
              <Text className="text-[#9CA3AF] text-sm ml-2">Estimated Delivery</Text>
            </View>
            <Text className="text-[#22C55E] text-sm font-semibold mt-1">
              {order.estimatedDelivery}
            </Text>
          </View>
        </View>

        <View className="bg-white rounded-2xl border border-[#EAEAEA] p-4">
          <Text className="text-base font-bold text-black mb-4">Order Timeline</Text>
          <OrderTimeline steps={timeline} />
        </View>
      </ScrollView>
      <AppTabBar />
    </View>
  );
}
