import CartListItem from "@/components/cart/CartListItem";
import { consolidateCartItems, MIN_ORDER_AMOUNT_EUR, useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { formatPrice } = useCurrency();
  const { items, itemCount, subtotal, taxTotal, getItemVatPercent, updateQuantity, removeItem } = useCart();
  const displayItems = useMemo(() => consolidateCartItems(items), [items]);

  const total = subtotal;
  const isEmpty = displayItems.length === 0;
  const meetsMinOrder = subtotal >= MIN_ORDER_AMOUNT_EUR;
  const minOrderRemaining = Math.max(0, MIN_ORDER_AMOUNT_EUR - subtotal);

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
            <Text className="text-white text-base font-semibold">Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {displayItems.map((item) => (
              <CartListItem
                key={item.id}
                item={item}
                vatPercent={getItemVatPercent(item)}
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
                  {formatPrice(subtotal)}
                </Text>
              </View>
              <View className="flex-row justify-between items-center py-2">
                <Text className="text-[#6B7280] text-base">Tax</Text>
                <Text className="text-black text-base font-medium">
                  {formatPrice(taxTotal)}
                </Text>
              </View>

              <View className="border-t border-[#EAEAEA] mt-4 pt-4 flex-row justify-between items-center">
                <Text className="text-black text-lg font-bold">Total</Text>
                <Text className="text-[#FF9800] text-[24px] font-bold">
                  {formatPrice(total)}
                </Text>
              </View>

              {!meetsMinOrder ? (
                <View className="mt-3 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2.5">
                  <Text className="text-[13px] leading-5 text-[#92400E]">
                    Minimum order amount is €{MIN_ORDER_AMOUNT_EUR.toFixed(2)}. Add €
                    {minOrderRemaining.toFixed(2)} more to checkout.
                  </Text>
                </View>
              ) : null}
            </View>
          </ScrollView>

          <View
            className="bg-white border-t border-[#EAEAEA] px-4 pt-3 gap-3"
            style={{ paddingBottom: insets.bottom + 12 }}
          >
            <TouchableOpacity
              onPress={() => router.push("/(tabs)")}
              className="rounded-xl py-3.5 justify-center items-center border border-[#E5E7EB]"
              activeOpacity={0.85}
            >
              <Text className="text-[#374151] text-base font-semibold">
                Continue Shopping
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                if (!meetsMinOrder) return;
                router.push("/checkout");
              }}
              disabled={!meetsMinOrder}
              className={`rounded-xl py-4 justify-center items-center ${
                meetsMinOrder ? "bg-[#FF9800]" : "bg-[#D1D5DB]"
              }`}
              activeOpacity={meetsMinOrder ? 0.85 : 1}
            >
              <Text
                className={`text-base font-semibold ${
                  meetsMinOrder ? "text-white" : "text-[#6B7280]"
                }`}
              >
                Proceed to Checkout
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}
