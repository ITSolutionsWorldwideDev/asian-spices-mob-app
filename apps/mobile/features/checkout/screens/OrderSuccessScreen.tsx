import AppHeader from "@/shared/components/AppHeader";
import AppTabBar from "@/shared/components/AppTabBar";
import { useCart } from "@/features/cart/contexts/CartContext";
import { apiRequest } from "@/shared/services/api/httpClient";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";

type ApiOrderItem = {
  id?: string;
  title?: string;
  price?: number | string;
  quantity?: number;
  image?: string | null;
};

type ApiOrderDetail = {
  id?: string;
  order_number?: string;
  subtotal_amount?: number | string;
  tax_amount?: number | string;
  shipping_amount?: number | string;
  total_amount?: number | string;
  payment_status?: string;
  order_status?: string;
  cart_items?: ApiOrderItem[];
};

function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return 0;
}

export default function OrderSuccessScreen() {
  const router = useRouter();
  const { clearCart } = useCart();
  const [orderDetail, setOrderDetail] = useState<ApiOrderDetail | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const { orderNumber, deliveryDate, orderId } = useLocalSearchParams<{
    orderNumber: string;
    deliveryDate: string;
    orderId: string;
  }>();

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  useEffect(() => {
    if (!orderId) return;
    setLoadingOrder(true);
    apiRequest<{ success?: boolean; order?: ApiOrderDetail }>(`/api/get-order?orderId=${orderId}`)
      .then((response) => {
        if (response.success && response.order) {
          setOrderDetail(response.order);
        }
      })
      .catch(() => setOrderDetail(null))
      .finally(() => setLoadingOrder(false));
  }, [orderId]);

  const computed = useMemo(() => {
    const subtotal = toNumber(orderDetail?.subtotal_amount);
    const tax = toNumber(orderDetail?.tax_amount);
    const shipping = toNumber(orderDetail?.shipping_amount);
    const total = toNumber(orderDetail?.total_amount);
    return {
      subtotal,
      tax,
      shipping,
      total,
      items: orderDetail?.cart_items ?? [],
      paymentStatus: orderDetail?.payment_status ?? "paid",
    };
  }, [orderDetail]);

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
            Payment Successful!
          </Text>
          <Text className="text-[#6B7280] text-[15px] text-center mt-3 leading-6 px-4">
            Your payment was completed and your order has been confirmed.
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
                {orderDetail?.order_number ?? orderNumber}
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
              <Text className="text-[#9CA3AF] text-sm mt-0.5">
                Payment status: {computed.paymentStatus}
              </Text>
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
          <Text className="text-[18px] font-bold text-[#111827] mb-4">Order Details</Text>

          {loadingOrder ? (
            <View className="py-3 flex-row items-center">
              <ActivityIndicator size="small" color="#FF9800" />
              <Text className="text-[#6B7280] ml-2">Loading order details...</Text>
            </View>
          ) : computed.items.length > 0 ? (
            <View>
              {computed.items.map((item, index) => (
                <View key={`${item.id ?? "item"}-${index}`} className="flex-row mb-3">
                  <Image
                    source={{ uri: item.image || "" }}
                    style={{ width: 56, height: 56, borderRadius: 10, backgroundColor: "#F3F4F6" }}
                    contentFit="cover"
                  />
                  <View className="flex-1 ml-3 justify-center">
                    <Text className="text-black text-[14px] font-semibold" numberOfLines={2}>
                      {item.title || "Product"}
                    </Text>
                    <Text className="text-[#6B7280] text-xs mt-0.5">
                      Qty: {item.quantity ?? 1}
                    </Text>
                  </View>
                  <Text className="text-black text-[14px] font-semibold">
                    €{(toNumber(item.price) * (item.quantity ?? 1)).toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-[#9CA3AF] text-sm mb-3">Order items will appear shortly.</Text>
          )}

          <View className="h-px bg-[#F3F4F6] my-2" />
          <View className="flex-row justify-between py-1.5">
            <Text className="text-[#6B7280]">Subtotal</Text>
            <Text className="text-black">€{computed.subtotal.toFixed(2)}</Text>
          </View>
          <View className="flex-row justify-between py-1.5">
            <Text className="text-[#6B7280]">Tax</Text>
            <Text className="text-black">€{computed.tax.toFixed(2)}</Text>
          </View>
          <View className="flex-row justify-between py-1.5">
            <Text className="text-[#6B7280]">Shipping</Text>
            <Text className="text-black">€{computed.shipping.toFixed(2)}</Text>
          </View>
          <View className="flex-row justify-between pt-2 mt-2 border-t border-[#E5E7EB]">
            <Text className="text-black font-bold">Total</Text>
            <Text className="text-[#FF9800] font-bold text-[17px]">
              €{computed.total.toFixed(2)}
            </Text>
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
