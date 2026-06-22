import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ACTIVE_COLOR = "#FF9800";
const INACTIVE_COLOR = "#9CA3AF";

type TabKey = "home" | "categories" | "reels" | "chat" | "profile";

type TabItem = {
  key: TabKey;
  label: string;
  route: "/(tabs)" | "/categories" | "/reels" | "/chat" | "/profile";
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon?: keyof typeof Ionicons.glyphMap;
};

const TABS: TabItem[] = [
  { key: "home", label: "Home", route: "/(tabs)", icon: "home-outline" },
  { key: "categories", label: "Categories", route: "/categories", icon: "grid-outline" },
  { key: "reels", label: "Reels", route: "/reels", icon: "videocam-outline" },
  { key: "chat", label: "Chat", route: "/chat", icon: "chatbubble-ellipses-outline", activeIcon: "chatbubble-ellipses" },
  { key: "profile", label: "Profile", route: "/profile", icon: "person-outline", activeIcon: "person" },
];

type AppTabBarProps = {
  activeTab?: TabKey;
};

export default function AppTabBar({ activeTab }: AppTabBarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="bg-white border-t border-[#F0F0F0] flex-row"
      style={{ paddingBottom: Math.max(insets.bottom, 8), paddingTop: 8 }}
    >
      {TABS.map((tab) => {
        const focused = activeTab === tab.key;
        const color = focused ? ACTIVE_COLOR : INACTIVE_COLOR;
        const iconName = focused && tab.activeIcon ? tab.activeIcon : tab.icon;

        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => router.replace(tab.route)}
            className="flex-1 items-center justify-center"
            activeOpacity={0.8}
          >
            <Ionicons name={iconName} size={22} color={color} />
            <Text
              className="text-[11px] font-medium mt-1"
              style={{ color }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
