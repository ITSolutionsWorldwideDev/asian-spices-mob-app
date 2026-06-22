import { useCart } from "@/contexts/CartContext";
import { useMenuDrawer } from "@/contexts/MenuDrawerContext";
import { getUnreadCount } from "@/services/notificationService";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type AppHeaderProps = {
  searchPlaceholder?: string;
  children?: React.ReactNode;
  contentPaddingBottom?: number;
};

export default function AppHeader({
  searchPlaceholder = "Search Conversations...",
  children,
  contentPaddingBottom = 14,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { openDrawer } = useMenuDrawer();
  const { itemCount } = useCart();
  const [unreadCount, setUnreadCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      getUnreadCount()
        .then(setUnreadCount)
        .catch(console.error);
    }, [])
  );

  return (
    <LinearGradient
      colors={["#FF9800", "#E53935"]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={{
        paddingTop: insets.top + 8,
        paddingBottom: contentPaddingBottom,
        paddingHorizontal: 16,
      }}
    >
      <View className="flex-row items-center gap-3">
        <TouchableOpacity
          onPress={openDrawer}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="menu" size={26} color="#FFFFFF" />
        </TouchableOpacity>

        <View className="flex-1 flex-row items-center bg-white/25 rounded-full px-3 h-[40px]">
          <Ionicons name="search" size={18} color="#FFFFFF" />
          <TextInput
            placeholder={searchPlaceholder}
            placeholderTextColor="rgba(255,255,255,0.85)"
            className="flex-1 ml-2 text-[14px] text-white"
          />
        </View>

        <TouchableOpacity
          onPress={() => router.push("/notifications")}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <View>
            <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
            {unreadCount > 0 ? (
              <View className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500" />
            ) : null}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/cart")}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <View>
            <Ionicons name="cart-outline" size={24} color="#FFFFFF" />
            {itemCount > 0 ? (
              <View className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] rounded-full bg-white justify-center items-center px-1">
                <Text className="text-[#FF9800] text-[10px] font-bold">
                  {itemCount > 99 ? "99+" : itemCount}
                </Text>
              </View>
            ) : null}
          </View>
        </TouchableOpacity>
      </View>
      {children}
    </LinearGradient>
  );
}
