import AppTabBar from "@/components/AppTabBar";
import NotificationListItem from "@/components/NotificationListItem";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/services/notificationService";
import type { AppNotification } from "@/types/notification";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    const data = await getNotifications();
    setNotifications(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadNotifications()
        .catch(console.error)
        .finally(() => setLoading(false));
    }, [loadNotifications]),
  );

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  const handlePress = async (notification: AppNotification) => {
    if (!notification.isRead) {
      try {
        await markNotificationAsRead(notification.id);
        await loadNotifications();
      } catch (error) {
        console.error(error);
      }
    }

    const orderId = notification.data?.orderId;
    if (typeof orderId === "string" && orderId) {
      router.push({ pathname: "/track-order/[id]", params: { id: orderId } });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      await loadNotifications();
    } catch (error) {
      Alert.alert(
        "Notifications",
        error instanceof Error ? error.message : "Could not mark all as read.",
      );
    }
  };

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
          <Text className="flex-1 text-center text-[18px] font-bold text-black">
            Notifications
          </Text>
          {unreadCount > 0 ? (
            <TouchableOpacity
              onPress={handleMarkAllRead}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="px-1"
            >
              <Text className="text-[#FF9800] text-[13px] font-semibold">
                Mark all
              </Text>
            </TouchableOpacity>
          ) : (
            <View className="w-9" />
          )}
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#FF9800" />
        </View>
      ) : notifications.length === 0 ? (
        <View className="flex-1 justify-center items-center px-8">
          <View className="w-20 h-20 rounded-full bg-[#F3F4F6] justify-center items-center mb-4">
            <Ionicons name="notifications-outline" size={40} color="#D1D5DB" />
          </View>
          <Text className="text-[18px] font-bold text-black text-center">
            No notifications yet
          </Text>
          <Text className="text-[#9CA3AF] text-sm text-center mt-2 leading-5">
            Order updates and alerts will show up here when you are logged in.
          </Text>
        </View>
      ) : (
        <>
          {unreadCount > 0 ? (
            <View className="bg-[#FFF7ED] px-4 py-3 border-b border-[#FFEDD5]">
              <Text className="text-[#C2410C] text-sm text-center">
                You have <Text className="font-bold">{unreadCount} unread</Text>{" "}
                notification{unreadCount === 1 ? "" : "s"}
              </Text>
            </View>
          ) : null}

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {notifications.map((notification, index) => (
              <NotificationListItem
                key={notification.id}
                notification={notification}
                onPress={() => handlePress(notification)}
                isLast={index === notifications.length - 1}
              />
            ))}
          </ScrollView>
        </>
      )}

      <AppTabBar />
    </View>
  );
}
