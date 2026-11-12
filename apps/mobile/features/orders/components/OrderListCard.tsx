import CancelItemsWorkflow, {
  type CancelSubmitPayload,
} from "@/features/orders/components/CancelItemsWorkflow";
import { useCart } from "@/features/cart/contexts/CartContext";
import {
  canShowCancelOrder,
  formatOrderDate,
  submitOrderCancellation,
} from "@/features/orders/services/orderService";
import type { CartItem } from "@/features/cart/types/cart";
import type { Order, OrderStatus } from "@/features/orders/types/order";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from "react-native";

type OrderListCardProps = {
  order: Order;
  onOrderUpdated?: () => void;
};

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80";

const STATUS_CONFIG: Record<
  OrderStatus,
  {
    label: string;
    badgeBg: string;
    badgeText: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
  }
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
  cancelled: {
    label: "Cancelled",
    badgeBg: "bg-[#FEE2E2]",
    badgeText: "text-[#991B1B]",
    icon: "close-circle",
    iconColor: "#EF4444",
  },
  partially_cancelled: {
    label: "Partially Cancelled",
    badgeBg: "bg-[#FFEDD5]",
    badgeText: "text-[#9A3412]",
    icon: "alert-circle-outline",
    iconColor: "#F97316",
  },
};

function toCartItems(order: Order): CartItem[] {
  return order.items
    .filter((item) => item.productId && item.productId !== "unknown")
    .filter((item) => (item.status || "").toLowerCase() !== "cancelled")
    .map((item) => ({
      id: item.productId,
      name: item.name,
      image: item.image || PLACEHOLDER_IMAGE,
      weight: "",
      price: item.unitPrice,
      quantity: item.quantity,
    }));
}

export default function OrderListCard({ order, onOrderUpdated }: OrderListCardProps) {
  const router = useRouter();
  const { replaceCartItems } = useCart();
  const status = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.processing;
  const [reordering, setReordering] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  // Match web: show Cancel Order until shipped/delivered.
  const showCancel = canShowCancelOrder(order);

  const handleReorder = async () => {
    if (order.items.length === 0) {
      Alert.alert("No items", "This order has no items to reorder.");
      return;
    }

    const cartItems = toCartItems(order);
    if (cartItems.length === 0) {
      Alert.alert("Unable to reorder", "Could not prepare items for checkout.");
      return;
    }

    setReordering(true);
    try {
      await replaceCartItems(cartItems);
      router.push("/checkout");
    } catch (error) {
      console.error(error);
      Alert.alert("Reorder failed", "Could not move items to checkout. Please try again.");
    } finally {
      setReordering(false);
    }
  };

  const handleCancelSubmit = async (payload: CancelSubmitPayload) => {
    try {
      const res = await submitOrderCancellation(order.id, payload);
      Alert.alert("Success", res.message || "Order cancelled successfully.");
      onOrderUpdated?.();
    } catch (error) {
      Alert.alert(
        "Cancellation failed",
        error instanceof Error ? error.message : "Could not cancel this order."
      );
      throw error;
    }
  };

  return (
    <View className="bg-white rounded-2xl border border-[#EAEAEA] p-4 mb-4">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center flex-1">
          <Ionicons name={status.icon} size={22} color={status.iconColor} />
          <Text className="text-base font-bold text-black ml-2">{order.orderNumber}</Text>
        </View>
        <View className={`rounded-full px-3 py-1 ${status.badgeBg}`}>
          <Text className={`text-xs font-semibold ${status.badgeText}`}>{status.label}</Text>
        </View>
      </View>

      <View className="flex-row items-center mb-3">
        <Text className="text-[#9CA3AF] text-sm">{formatOrderDate(order.placedAt)}</Text>
        <Text className="text-[#9CA3AF] text-sm mx-2">•</Text>
        <Text className="text-[#9CA3AF] text-sm">
          {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
        </Text>
      </View>

      {order.items.map((item) => {
        const itemCancelled = (item.status || "").toLowerCase() === "cancelled";
        return (
          <View
            key={`${order.id}-${item.productId}`}
            className="flex-row justify-between mb-2"
          >
            <Text
              className={`text-sm flex-1 mr-2 ${
                itemCancelled ? "text-[#9CA3AF] line-through" : "text-[#374151]"
              }`}
              numberOfLines={1}
            >
              {item.quantity}x {item.name}
              {itemCancelled ? " (Cancelled)" : ""}
            </Text>
            <Text
              className={`text-sm font-medium ${
                itemCancelled ? "text-[#9CA3AF]" : "text-[#111827]"
              }`}
            >
              ${(item.unitPrice * item.quantity).toFixed(2)}
            </Text>
          </View>
        );
      })}

      {!order.isCancelled && order.status !== "cancelled" ? (
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
              <Text className="text-[#1E40AF] text-sm font-semibold ml-2">Track My Order</Text>
            </View>
            <Text className="text-[#2563EB] text-xs font-semibold">Open →</Text>
          </View>
          <Text className="text-[#2563EB] text-sm font-medium mt-1">
            {order.trackingNumber || "Tracking number is not assigned yet"}
          </Text>
        </TouchableOpacity>
      ) : null}

      <View className="border-t border-[#F3F4F6] pt-3 flex-row justify-between items-center mb-4">
        <Text className="text-base font-bold text-black">Total</Text>
        <Text className="text-[#FF9800] text-xl font-bold">${order.total.toFixed(2)}</Text>
      </View>

      {showCancel ? (
        <TouchableOpacity
          onPress={() => setCancelOpen(true)}
          className="border border-[#FECACA] bg-[#FEF2F2] rounded-xl py-3 items-center mb-3 flex-row justify-center"
          activeOpacity={0.85}
        >
          <Ionicons name="warning-outline" size={16} color="#DC2626" />
          <Text className="text-[#B91C1C] text-sm font-semibold ml-2">Cancel Order</Text>
        </TouchableOpacity>
      ) : null}

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
          onPress={handleReorder}
          disabled={reordering}
          className="flex-1 bg-[#FF9800] rounded-xl py-3 items-center"
          activeOpacity={0.85}
        >
          {reordering ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white text-sm font-semibold">Reorder</Text>
          )}
        </TouchableOpacity>
      </View>

      <CancelItemsWorkflow
        visible={cancelOpen}
        order={order}
        onClose={() => setCancelOpen(false)}
        onSubmit={handleCancelSubmit}
      />
    </View>
  );
}
