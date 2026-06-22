import CartListItem from "@/components/cart/CartListItem";
import {
  FREE_SHIPPING_THRESHOLD,
  getCartTotal,
  getShippingFee,
  useCart,
} from "@/contexts/CartContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items, itemCount, subtotal, updateQuantity, removeItem } = useCart();

  const shipping = getShippingFee(subtotal);
  const total = getCartTotal(subtotal);
  const isEmpty = items.length === 0;

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
            Shopping Cart{!isEmpty ? ` (${itemCount})` : ""}
          </Text>
        </View>
      </View>

      {isEmpty ? (
        <View className="flex-1 justify-center items-center px-8">
          <View className="w-24 h-24 rounded-full bg-[#F3F4F6] justify-center items-center mb-6">
            <Ionicons name="bag-outline" size={48} color="#9CA3AF" />
          </View>
          <Text className="text-[22px] font-bold text-black text-center">
            Your cart is empty
          </Text>
          <Text className="text-[#9CA3AF] text-base text-center mt-2 leading-6">
            Add some delicious spices to get started!
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)")}
            className="bg-[#FF9800] rounded-full px-8 py-3.5 mt-8"
            activeOpacity={0.85}
          >
            <Text className="text-white text-base font-semibold">Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {items.map((item) => (
              <CartListItem
                key={item.id}
                item={item}
                onIncrease={() => updateQuantity(item.id, item.quantity + 1)}
                onDecrease={() => {
                  if (item.quantity === 1) {
                    removeItem(item.id);
                  } else {
                    updateQuantity(item.id, item.quantity - 1);
                  }
                }}
                onRemove={() => removeItem(item.id)}
              />
            ))}

            <View className="mt-4 pt-2">
              <View className="flex-row justify-between items-center py-2">
                <Text className="text-[#6B7280] text-base">Subtotal</Text>
                <Text className="text-black text-base font-medium">
                  ${subtotal.toFixed(2)}
                </Text>
              </View>
              <View className="flex-row justify-between items-center py-2">
                <Text className="text-[#6B7280] text-base">Shipping</Text>
                <Text className="text-black text-base font-medium">
                  {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
                </Text>
              </View>
              <Text className="text-[#9CA3AF] text-sm mt-1">
                Free shipping on orders over ${FREE_SHIPPING_THRESHOLD.toFixed(0)}
              </Text>

              <View className="border-t border-[#EAEAEA] mt-4 pt-4 flex-row justify-between items-center">
                <Text className="text-black text-lg font-bold">Total</Text>
                <Text className="text-[#FF9800] text-[24px] font-bold">
                  ${total.toFixed(2)}
                </Text>
              </View>
            </View>
          </ScrollView>

          <View
            className="bg-white border-t border-[#EAEAEA] px-4 pt-3"
            style={{ paddingBottom: insets.bottom + 12 }}
          >
            <TouchableOpacity
              onPress={() => router.push("/checkout")}
              className="bg-[#FF9800] rounded-xl py-4 justify-center items-center"
              activeOpacity={0.85}
            >
              <Text className="text-white text-base font-semibold">
                Proceed to Checkout
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}
