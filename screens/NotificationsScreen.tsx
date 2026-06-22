import AppTabBar from "@/components/AppTabBar";
import NotificationListItem from "@/components/NotificationListItem";
import {
  getNotifications,
  markNotificationAsRead,
} from "@/services/notificationService";
import type { AppNotification } from "@/types/notification";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
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
    }, [loadNotifications])
  );

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  const handlePress = async (notification: AppNotification) => {
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id);
      await loadNotifications();
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
          <Text className="flex-1 text-center text-[18px] font-bold text-black mr-9">
            Notifications
          </Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#FF9800" />
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
