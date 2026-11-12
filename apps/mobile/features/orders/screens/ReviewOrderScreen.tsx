import AppHeader from "@/shared/components/AppHeader";
import AppTabBar from "@/shared/components/AppTabBar";
import CancelItemsWorkflow, {
  type CancelSubmitPayload,
} from "@/features/orders/components/CancelItemsWorkflow";
import { useCart } from "@/features/cart/contexts/CartContext";
import {
  canShowCancelOrder,
  formatOrderDate,
  getOrderById,
  submitOrderCancellation,
} from "@/features/orders/services/orderService";
import { getProductById } from "@/features/products/services/productService";
import type { CartItem } from "@/features/cart/types/cart";
import type { Order, OrderStatus } from "@/features/orders/types/order";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80";

const STATUS_LABEL: Record<OrderStatus, string> = {
  delivered: "Delivered",
  shipped: "Shipped",
  processing: "Processing",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  partially_cancelled: "Partially Cancelled",
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

export default function ReviewOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { replaceCartItems } = useCart();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const loadOrder = useCallback(async () => {
    if (!id) {
      setOrder(null);
      return;
    }

    const data = await getOrderById(id);
    if (!data) {
      setOrder(null);
      return;
    }

    const itemsWithImages = await Promise.all(
      data.items.map(async (item) => {
        if (item.image) return item;
        const product = await getProductById(item.productId);
        return { ...item, image: product?.image };
      })
    );

    setOrder({ ...data, items: itemsWithImages });
  }, [id]);

  useEffect(() => {
    setLoading(true);
    loadOrder()
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [loadOrder]);

  const handleReorder = async () => {
    if (!order || order.items.length === 0) {
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
    if (!order) return;
    try {
      const res = await submitOrderCancellation(order.id, payload);
      Alert.alert("Success", res.message || "Order cancelled successfully.");
      await loadOrder();
    } catch (error) {
      Alert.alert(
        "Cancellation failed",
        error instanceof Error ? error.message : "Could not cancel this order."
      );
      throw error;
    }
  };

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

  const showCancel = canShowCancelOrder(order);

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
            Review Order
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="bg-white rounded-2xl border border-[#EAEAEA] p-4 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-[#9CA3AF] text-sm">Order ID</Text>
              <Text className="text-[#111827] text-lg font-bold mt-1">
                {order.orderNumber}
              </Text>
            </View>
            <View
              className={`rounded-full px-3 py-1 ${
                order.status === "cancelled"
                  ? "bg-[#FEE2E2]"
                  : order.status === "partially_cancelled"
                    ? "bg-[#FFEDD5]"
                    : "bg-[#FFF7ED]"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  order.status === "cancelled"
                    ? "text-[#991B1B]"
                    : order.status === "partially_cancelled"
                      ? "text-[#9A3412]"
                      : "text-[#C2410C]"
                }`}
              >
                {STATUS_LABEL[order.status]}
              </Text>
            </View>
          </View>

          <Text className="text-[#6B7280] text-sm mb-1">
            Placed on {formatOrderDate(order.placedAt)}
          </Text>
          <Text className="text-[#6B7280] text-sm">
            {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
          </Text>
        </View>

        <View className="bg-white rounded-2xl border border-[#EAEAEA] p-4 mb-4">
          <Text className="text-base font-bold text-black mb-3">Order Items</Text>
          {order.items.map((item) => {
            const itemCancelled = (item.status || "").toLowerCase() === "cancelled";
            return (
              <View
                key={`${order.id}-${item.productId}`}
                className="flex-row items-center mb-3 pb-3 border-b border-[#F3F4F6]"
              >
                <Image
                  source={{ uri: item.image || PLACEHOLDER_IMAGE }}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 12,
                    opacity: itemCancelled ? 0.5 : 1,
                  }}
                  contentFit="cover"
                />
                <View className="flex-1 ml-3">
                  <Text
                    className={`text-[15px] font-semibold ${
                      itemCancelled ? "text-[#9CA3AF] line-through" : "text-[#111827]"
                    }`}
                    numberOfLines={2}
                  >
                    {item.name}
                  </Text>
                  <Text className="text-[#6B7280] text-sm mt-1">Qty: {item.quantity}</Text>
                  {itemCancelled ? (
                    <Text className="text-[#DC2626] text-xs font-medium mt-1">Cancelled</Text>
                  ) : null}
                </View>
                <Text
                  className={`text-sm font-semibold ${
                    itemCancelled ? "text-[#9CA3AF]" : "text-[#111827]"
                  }`}
                >
                  ${(item.unitPrice * item.quantity).toFixed(2)}
                </Text>
              </View>
            );
          })}

          <View className="flex-row justify-between items-center pt-1">
            <Text className="text-base font-bold text-black">Total</Text>
            <Text className="text-[#FF9800] text-xl font-bold">
              ${order.total.toFixed(2)}
            </Text>
          </View>
        </View>

        <View className="bg-white rounded-2xl border border-[#EAEAEA] p-4 mb-4">
          <View className="flex-row items-center mb-2">
            <Ionicons name="location-outline" size={18} color="#FF9800" />
            <Text className="text-base font-bold text-black ml-2">Delivery Address</Text>
          </View>
          <Text className="text-[#374151] text-sm leading-5">{order.deliveryAddress}</Text>
        </View>

        {order.status !== "cancelled" ? (
          <View className="bg-white rounded-2xl border border-[#EAEAEA] p-4 mb-4">
            <View className="flex-row items-center mb-2">
              <Ionicons name="car-outline" size={18} color="#2563EB" />
              <Text className="text-base font-bold text-black ml-2">Tracking</Text>
            </View>
            <Text className="text-[#374151] text-sm mb-1">{order.trackingNumber}</Text>
            <Text className="text-[#6B7280] text-sm">
              Est. delivery: {order.estimatedDelivery}
            </Text>

            <TouchableOpacity
              onPress={() =>
                router.push({ pathname: "/track-order/[id]", params: { id: order.id } })
              }
              className="mt-3 border border-[#2563EB] rounded-xl py-3 items-center"
              activeOpacity={0.85}
            >
              <Text className="text-[#2563EB] text-sm font-semibold">Track My Order</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {showCancel ? (
          <TouchableOpacity
            onPress={() => setCancelOpen(true)}
            className="border border-[#FECACA] bg-[#FEF2F2] rounded-xl py-4 items-center mb-3 flex-row justify-center"
            activeOpacity={0.85}
          >
            <Ionicons name="warning-outline" size={18} color="#DC2626" />
            <Text className="text-[#B91C1C] text-base font-semibold ml-2">Cancel Order</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          onPress={handleReorder}
          disabled={reordering}
          className="bg-[#FF9800] rounded-xl py-4 items-center"
          activeOpacity={0.85}
        >
          {reordering ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white text-base font-semibold">Reorder</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <CancelItemsWorkflow
        visible={cancelOpen}
        order={order}
        onClose={() => setCancelOpen(false)}
        onSubmit={handleCancelSubmit}
      />

      <AppTabBar />
    </View>
  );
}
