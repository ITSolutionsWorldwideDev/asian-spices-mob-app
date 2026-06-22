import drawerMenuData from "@/data/drawerMenu.json";
import { useMenuDrawer } from "@/contexts/MenuDrawerContext";
import type { DrawerMenuData, HealthyLivingItem } from "@/types/drawer";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const menuData = drawerMenuData as DrawerMenuData;

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
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      className="flex-row items-center rounded-xl px-3 py-3 mb-2.5"
      style={{ backgroundColor: item.backgroundColor }}
    >
      <View
        className="w-9 h-9 rounded-lg justify-center items-center mr-3"
        style={{ backgroundColor: `${item.iconColor}22` }}
      >
        <Ionicons name={item.icon} size={18} color={item.iconColor} />
      </View>
      <View className="flex-1">
        <Text className="text-[14px] font-semibold text-black">{item.title}</Text>
        <Text className="text-[12px] text-[#9CA3AF] mt-0.5">{item.subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

export default function DrawerMenu() {
  const { isOpen, closeDrawer } = useMenuDrawer();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [healthyExpanded, setHealthyExpanded] = useState(true);

  const navigate = (path: "/" | "/categories" | "/wishlist" | "/my-orders") => {
    closeDrawer();
    router.push(path);
  };

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={closeDrawer}>
      <View className="flex-1 flex-row">
        <Pressable className="flex-1 bg-black/40" onPress={closeDrawer} />

        <View
          className="w-[85%] max-w-[320px] bg-white h-full"
          style={{ paddingTop: insets.top }}
        >
          <View className="flex-row justify-end px-4 py-3">
            <TouchableOpacity
              onPress={closeDrawer}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="w-9 h-9 justify-center items-center"
            >
              <Ionicons name="close" size={26} color="#333333" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerClassName="px-5 pb-8"
          >
            <TouchableOpacity
              onPress={() => navigate("/")}
              className="py-3.5 border-b border-[#F0F0F0]"
            >
              <Text className="text-[16px] font-semibold text-black">Home</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigate("/categories")}
              className="py-3.5 border-b border-[#F0F0F0]"
            >
              <Text className="text-[16px] font-semibold text-black">Categories</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setHealthyExpanded((prev) => !prev)}
              className="flex-row items-center justify-between py-4"
              activeOpacity={0.7}
            >
              <Text className="text-[13px] font-bold text-black tracking-wide">
                HEALTHY LIVING
              </Text>
              <Ionicons
                name={healthyExpanded ? "chevron-up" : "chevron-down"}
                size={18}
                color="#333333"
              />
            </TouchableOpacity>

            {healthyExpanded ? (
              <View className="mb-2">
                {menuData.healthyLivingItems.map((item) => (
                  <HealthyLivingCard key={item.id} item={item} />
                ))}
              </View>
            ) : null}

            <View className="h-px bg-[#F0F0F0] my-2" />

            {menuData.bottomLinks.map((link) => (
              <TouchableOpacity
                key={link.id}
                onPress={() => {
                  if (link.id === "wishlist") {
                    navigate("/wishlist");
                    return;
                  }
                  if (link.id === "orders") {
                    navigate("/my-orders");
                    return;
                  }
                  closeDrawer();
                }}
                className="py-3.5"
                activeOpacity={0.7}
              >
                <Text className="text-[16px] font-semibold text-black">
                  {link.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
