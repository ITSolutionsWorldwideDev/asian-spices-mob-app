import type { AppNotification } from "@/features/profile/types/notification";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type NotificationStyle = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  bgColor: string;
};

const NOTIFICATION_STYLES: Record<string, NotificationStyle> = {
  order_placed: {
    icon: "receipt-outline",
    iconColor: "#FF9800",
    bgColor: "#FFEDD5",
  },
  order_paid: {
    icon: "card-outline",
    iconColor: "#22C55E",
    bgColor: "#D1FAE5",
  },
  order_delivered: {
    icon: "cube-outline",
    iconColor: "#22C55E",
    bgColor: "#D1FAE5",
  },
  promotion: {
    icon: "pricetag-outline",
    iconColor: "#FF9800",
    bgColor: "#FFEDD5",
  },
  order_shipped: {
    icon: "cube-outline",
    iconColor: "#3B82F6",
    bgColor: "#DBEAFE",
  },
  price_drop: {
    icon: "heart-outline",
    iconColor: "#EF4444",
    bgColor: "#FEE2E2",
  },
  review: {
    icon: "star-outline",
    iconColor: "#EAB308",
    bgColor: "#FEF9C3",
  },
  recipe: {
    icon: "trending-up-outline",
    iconColor: "#A855F7",
    bgColor: "#F3E8FF",
  },
};

const DEFAULT_STYLE: NotificationStyle = {
  icon: "notifications-outline",
  iconColor: "#6B7280",
  bgColor: "#F3F4F6",
};

type NotificationListItemProps = {
  notification: AppNotification;
  onPress: () => void;
  isLast?: boolean;
};

export default function NotificationListItem({
  notification,
  onPress,
  isLast = false,
}: NotificationListItemProps) {
  const style = NOTIFICATION_STYLES[notification.type] ?? DEFAULT_STYLE;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className={`px-4 py-4 ${notification.isRead ? "bg-white" : "bg-[#EFF6FF]"}`}
    >
      <View className="flex-row items-start">
        <View
          className="w-11 h-11 rounded-full justify-center items-center mr-3"
          style={{ backgroundColor: style.bgColor }}
        >
          <Ionicons name={style.icon} size={22} color={style.iconColor} />
        </View>

        <View className="flex-1 pr-4">
          <Text className="text-[15px] font-bold text-black">{notification.title}</Text>
          <Text className="text-[#4B5563] text-sm mt-1 leading-5">
            {notification.description}
          </Text>
          <Text className="text-[#9CA3AF] text-xs mt-2">{notification.timeAgo}</Text>
        </View>

        {!notification.isRead ? (
          <View className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] mt-1" />
        ) : null}
      </View>

      {!isLast ? <View className="h-px bg-[#F3F4F6] mt-4 -mx-4" /> : null}
    </TouchableOpacity>
  );
}
