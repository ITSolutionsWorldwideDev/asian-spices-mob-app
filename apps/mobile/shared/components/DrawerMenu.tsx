import { useCart } from "@/features/cart/contexts/CartContext";
import { useWishlist } from "@/features/wishlist/contexts/WishlistContext";
import { useMenuDrawer } from "@/shared/contexts/MenuDrawerContext";
import drawerMenuData from "@/shared/data/drawerMenu.json";
import { logout } from "@/shared/services/api/authService";
import type { DrawerMenuData, DrawerNavItem, HealthyLivingItem } from "@/shared/types/drawer";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter, type Href } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const menuData = drawerMenuData as DrawerMenuData;

const HEALTHY_LIVING_LOCAL_IMAGES: Record<string, number> = {
  "1": require("../../assets/images/health-benefits-menu.jpg"),
  "2": require("../../assets/images/herbal-food-supplements-menu.jpg"),
  "3": require("../../assets/images/herbal-skin-products-menu.jpg"),
  "4": require("../../assets/images/herbal-hair-products-menu.jpg"),
};

function getHealthyLivingImageSource(item: HealthyLivingItem) {
  const localImage = HEALTHY_LIVING_LOCAL_IMAGES[item.id];
  if (localImage) return localImage;
  return { uri: item.image };
}

function MenuDivider() {
  return <View className="h-px bg-[#E5E7EB]" />;
}

function MenuRow({
  item,
  badge,
  onPress,
}: {
  item: DrawerNavItem;
  badge?: number;
  onPress: () => void;
}) {
  return (
    <>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        className="flex-row items-center py-4"
      >
        <Ionicons name={item.icon} size={22} color="#1B0D07" />
        <Text className="flex-1 ml-4 text-[16px] text-[#1B0D07]">{item.label}</Text>
        {badge && badge > 0 ? (
          <View className="min-w-[22px] h-[22px] rounded-full bg-[#EF4444] justify-center items-center px-1.5 mr-2">
            <Text className="text-white text-[11px] font-bold">{badge > 99 ? "99+" : badge}</Text>
          </View>
        ) : null}
        <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
      </TouchableOpacity>
      <MenuDivider />
    </>
  );
}

function HealthyLivingCard({ item }: { item: HealthyLivingItem }) {
  const { closeDrawer } = useMenuDrawer();
  const router = useRouter();

  const handlePress = () => {
    closeDrawer();
    if (item.route) {
      router.push(item.route as Href);
    }
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handlePress}
        className="flex-row items-center py-3"
      >
        <Image
          source={getHealthyLivingImageSource(item)}
          style={{ width: 52, height: 52, borderRadius: 10 }}
          contentFit="cover"
        />
        <View className="flex-1 ml-3">
          <Text className="text-[15px] font-semibold text-[#1B0D07]">{item.title}</Text>
          <Text className="text-[13px] text-[#9CA3AF] mt-0.5">{item.subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
      </TouchableOpacity>
      <MenuDivider />
    </>
  );
}

export default function DrawerMenu() {
  const { isOpen, closeDrawer } = useMenuDrawer();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { itemCount, resetLocalCart } = useCart();
  const { resetLocalWishlist } = useWishlist();
  const [healthyExpanded, setHealthyExpanded] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const navigate = (route: string) => {
    closeDrawer();
    router.push(route as Href);
  };

  const handleLogout = async () => {
    if (loggingOut) return;

    try {
      setLoggingOut(true);
      await logout();
      resetLocalWishlist();
      resetLocalCart();
      closeDrawer();
      router.replace("/login");
    } catch (error) {
      console.error(error);
      Alert.alert("Logout failed", "Could not log out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={closeDrawer}>
      <View className="flex-1 flex-row">
        <Pressable className="flex-1 bg-black/40" onPress={closeDrawer} />

        <View
          className="w-[88%] max-w-[360px] bg-white h-full"
          style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
        >
          <View className="flex-row items-center justify-between px-5 py-4">
            <Text className="text-[22px] font-bold text-[#1B0D07]">Asian Spices</Text>
            <TouchableOpacity
              onPress={closeDrawer}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="w-9 h-9 rounded-full border border-[#E5E7EB] justify-center items-center"
            >
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerClassName="px-5 pb-8"
          >
            {menuData.mainLinks.map((item) => (
              <MenuRow
                key={item.id}
                item={item}
                onPress={() => item.route && navigate(item.route)}
              />
            ))}

            <View>
              <TouchableOpacity
                onPress={() => setHealthyExpanded((prev) => !prev)}
                className="flex-row items-center py-4"
                activeOpacity={0.7}
              >
                <Ionicons
                  name="leaf-outline"
                  size={22}
                  color={healthyExpanded ? "#9CA3AF" : "#1B0D07"}
                />
                <Text
                  className={`flex-1 ml-4 text-[16px] ${
                    healthyExpanded ? "text-[#9CA3AF]" : "text-[#1B0D07]"
                  }`}
                >
                  Healthy Living
                </Text>
                <Ionicons
                  name={healthyExpanded ? "chevron-up" : "chevron-down"}
                  size={18}
                  color="#D1D5DB"
                />
              </TouchableOpacity>
              <MenuDivider />
            </View>

            {healthyExpanded ? (
              <View>
                {menuData.healthyLivingItems.map((item) => (
                  <HealthyLivingCard key={item.id} item={item} />
                ))}
              </View>
            ) : null}

            {menuData.bottomLinks.map((item) => (
              <MenuRow
                key={item.id}
                item={item}
                badge={item.id === "cart" ? itemCount : undefined}
                onPress={() => item.route && navigate(item.route)}
              />
            ))}

            <View>
              <TouchableOpacity
                onPress={handleLogout}
                disabled={loggingOut}
                activeOpacity={0.7}
                className="flex-row items-center py-4 mt-2"
              >
                <Ionicons name="person-circle-outline" size={22} color="#EF4444" />
                <Text className="ml-4 text-[16px] text-[#EF4444] font-medium">
                  {loggingOut ? "Logging out..." : "Logout"}
                </Text>
              </TouchableOpacity>
              <MenuDivider />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
