import AppHeader from "@/shared/components/AppHeader";
import AppTabBar from "@/shared/components/AppTabBar";
import OrderListCard from "@/features/orders/components/OrderListCard";
import { getOrders } from "@/features/orders/services/orderService";
import type { Order } from "@/features/orders/types/order";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function MyOrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    const data = await getOrders();
    setOrders(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadOrders()
        .catch(console.error)
        .finally(() => setLoading(false));
    }, [loadOrders])
  );

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
            My Orders
          </Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#FF9800" />
        </View>
      ) : orders.length === 0 ? (
        <View className="flex-1 justify-center items-center px-8">
          <Ionicons name="cube-outline" size={48} color="#D1D5DB" />
          <Text className="text-[#9CA3AF] text-center mt-4 text-base">
            No orders yet. Start shopping to place your first order!
          </Text>
          <TouchableOpacity
            onPress={() => router.replace("/(tabs)")}
            className="bg-[#FF9800] rounded-full px-8 py-3.5 mt-6"
            activeOpacity={0.85}
          >
            <Text className="text-white text-base font-semibold">Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 16,
          }}
          showsVerticalScrollIndicator={false}
        >
          {orders.map((order) => (
            <OrderListCard key={order.id} order={order} onOrderUpdated={loadOrders} />
          ))}
        </ScrollView>
      )}
      <AppTabBar />
    </View>
  );
}
