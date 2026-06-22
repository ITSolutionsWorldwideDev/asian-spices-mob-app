import { formatOrderDate } from "@/services/orderService";
import type { Order, OrderStatus } from "@/types/order";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type OrderListCardProps = {
  order: Order;
};

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; badgeBg: string; badgeText: string; icon: keyof typeof Ionicons.glyphMap; iconColor: string }
> = {
  delivered: {
    label: "Delivered",
    badgeBg: "bg-[#D1FAE5]",
    badgeText: "text-[#166534]",
    icon: "checkmark-circle",
    iconColor: "#22C55E",
  },
  shipped: {
    label: "Shipped",
    badgeBg: "bg-[#DBEAFE]",
    badgeText: "text-[#1D4ED8]",
    icon: "car-outline",
    iconColor: "#3B82F6",
  },
  processing: {
    label: "Processing",
    badgeBg: "bg-[#FEF3C7]",
    badgeText: "text-[#92400E]",
    icon: "time-outline",
    iconColor: "#F59E0B",
  },
  confirmed: {
    label: "Confirmed",
    badgeBg: "bg-[#F3F4F6]",
    badgeText: "text-[#374151]",
    icon: "checkmark-circle-outline",
    iconColor: "#6B7280",
  },
};

export default function OrderListCard({ order }: OrderListCardProps) {
  const router = useRouter();
  const status = STATUS_CONFIG[order.status];
  const showTracking = order.status === "shipped" || order.status === "delivered";

  return (
    <View className="bg-white rounded-2xl border border-[#EAEAEA] p-4 mb-4">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center flex-1">
          <Ionicons name={status.icon} size={22} color={status.iconColor} />
          <Text className="text-base font-bold text-black ml-2">
            #{order.orderNumber}
          </Text>
        </View>
        <View className={`rounded-full px-3 py-1 ${status.badgeBg}`}>
          <Text className={`text-xs font-semibold ${status.badgeText}`}>
            {status.label}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center mb-3">
        <Text className="text-[#9CA3AF] text-sm">{formatOrderDate(order.placedAt)}</Text>
        <Text className="text-[#9CA3AF] text-sm mx-2">•</Text>
        <Text className="text-[#9CA3AF] text-sm">
          {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
        </Text>
      </View>

      {order.items.map((item) => (
        <View key={`${order.id}-${item.productId}`} className="flex-row justify-between mb-2">
          <Text className="text-[#374151] text-sm flex-1 mr-2" numberOfLines={1}>
            {item.quantity}x {item.name}
          </Text>
          <Text className="text-[#111827] text-sm font-medium">
            ${(item.unitPrice * item.quantity).toFixed(2)}
          </Text>
        </View>
      ))}

      {showTracking ? (
        <TouchableOpacity
          onPress={() =>
            router.push({ pathname: "/track-order/[id]", params: { id: order.id } })
          }
          activeOpacity={0.85}
          className="bg-[#EFF6FF] rounded-xl p-3 mt-2 mb-3"
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="car-outline" size={16} color="#2563EB" />
              <Text className="text-[#1E40AF] text-sm font-semibold ml-2">Tracking Number</Text>
            </View>
            <Text className="text-[#2563EB] text-xs font-semibold">Track →</Text>
          </View>
          <Text className="text-[#2563EB] text-sm font-medium mt-1">
            {order.trackingNumber}
          </Text>
          {order.status === "shipped" ? (
            <View className="flex-row items-center mt-2">
              <Ionicons name="location-outline" size={14} color="#6B7280" />
              <Text className="text-[#6B7280] text-xs ml-1">
                Est. delivery: {order.estimatedDelivery}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
      ) : null}

      <View className="border-t border-[#F3F4F6] pt-3 flex-row justify-between items-center mb-4">
        <Text className="text-base font-bold text-black">Total</Text>
        <Text className="text-[#FF9800] text-xl font-bold">${order.total.toFixed(2)}</Text>
      </View>

      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={() =>
            router.push({ pathname: "/review-order/[id]", params: { id: order.id } })
          }
          className="flex-1 border border-[#E5E7EB] rounded-xl py-3 items-center"
          activeOpacity={0.85}
        >
          <Text className="text-[#374151] text-sm font-semibold">Review Order</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 bg-[#FF9800] rounded-xl py-3 items-center"
          activeOpacity={0.85}
        >
          <Text className="text-white text-sm font-semibold">Reorder</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
