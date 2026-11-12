import AppTabBar from "@/shared/components/AppTabBar";
import ProfileMenuSection from "@/features/profile/components/ProfileMenuSection";
import NotificationToggleItem from "@/features/profile/components/settings/NotificationToggleItem";
import {
  getNotificationPreferences,
  updateNotificationPreference,
} from "@/features/profile/services/notificationPreferencesService";
import type {
  NotificationPreferenceKey,
  NotificationPreferences,
  NotificationPreferenceSection,
} from "@/features/profile/types/notificationPreferences";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SECTIONS: NotificationPreferenceSection[] = [
  {
    title: "PUSH NOTIFICATIONS",
    items: [
      {
        key: "pushEnabled",
        title: "Enable Push Notifications",
        subtitle: "Receive notifications on your device",
      },
      {
        key: "orderUpdates",
        title: "Order Updates",
        subtitle: "Track your orders in real-time",
      },
      {
        key: "recipeReelUpdates",
        title: "Recipe Reel Updates",
        subtitle: "New reels from creators you follow",
      },
    ],
  },
  {
    title: "PRODUCT UPDATES",
    items: [
      {
        key: "newProducts",
        title: "New Products",
        subtitle: "Be the first to know about new spices",
      },
      {
        key: "priceDrops",
        title: "Price Drops",
        subtitle: "Get alerts on price reductions",
      },
      {
        key: "restockAlerts",
        title: "Restock Alerts",
        subtitle: "Know when wishlist items are back",
      },
    ],
  },
  {
    title: "EMAIL",
    items: [
      {
        key: "promotionalEmails",
        title: "Promotional Emails",
        subtitle: "Deals, offers, and discounts",
      },
    ],
  },
];

const PUSH_DEPENDENT_KEYS = new Set<NotificationPreferenceKey>([
  "orderUpdates",
  "recipeReelUpdates",
  "newProducts",
  "priceDrops",
  "restockAlerts",
]);

export default function NotificationPreferencesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPreferences = useCallback(async () => {
    const data = await getNotificationPreferences();
    setPreferences(data);
  }, []);

  useEffect(() => {
    loadPreferences()
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [loadPreferences]);

  const handleToggle = async (key: NotificationPreferenceKey, value: boolean) => {
    if (!preferences) return;

    const previous = preferences;
    const optimistic = { ...preferences, [key]: value };
    if (key === "pushEnabled" && !value) {
      optimistic.orderUpdates = false;
      optimistic.recipeReelUpdates = false;
      optimistic.newProducts = false;
      optimistic.priceDrops = false;
      optimistic.restockAlerts = false;
    }
    setPreferences(optimistic);

    try {
      const updated = await updateNotificationPreference(key, value);
      setPreferences(updated);

      if (key === "pushEnabled" && value) {
        const { getStoredPushToken } = await import(
          "@/features/profile/services/pushNotificationService"
        );
        const token = await getStoredPushToken();
        if (!token) {
          Alert.alert(
            "Push notifications",
            "Permission was not granted, or this device cannot receive push. Use a physical device with a development build (not Expo Go on Android).",
          );
        }
      }
    } catch (error) {
      setPreferences(previous);
      const message =
        error instanceof Error
          ? error.message
          : "Could not save notification preferences.";
      Alert.alert("Notifications", message);
    }
  };

  return (
    <View className="flex-1 bg-[#F5F5F5]">
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

      {loading || !preferences ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#FF9800" />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-4 pt-5 pb-6"
          showsVerticalScrollIndicator={false}
        >
          {SECTIONS.map((section) => (
            <ProfileMenuSection key={section.title} title={section.title}>
              {section.items.map((item, index) => (
                <NotificationToggleItem
                  key={item.key}
                  item={item}
                  value={preferences[item.key]}
                  onValueChange={(value) => handleToggle(item.key, value)}
                  showDivider={index < section.items.length - 1}
                  disabled={
                    !preferences.pushEnabled && PUSH_DEPENDENT_KEYS.has(item.key)
                  }
                />
              ))}
            </ProfileMenuSection>
          ))}
        </ScrollView>
      )}

      <AppTabBar activeTab="profile" />
    </View>
  );
}
