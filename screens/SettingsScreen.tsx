import AppTabBar from "@/components/AppTabBar";
import ProfileMenuSection from "@/components/profile/ProfileMenuSection";
import SettingsMenuItem from "@/components/settings/SettingsMenuItem";
import { getSettingsData } from "@/services/settingsService";
import type { UserPreferences } from "@/types/settings";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettingsData()
      .then((data) => setPreferences(data.preferences))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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
            Settings
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
          <ProfileMenuSection title="ACCOUNT">
            <SettingsMenuItem
              icon="person-outline"
              title="Edit Profile"
              onPress={() => router.push("/edit-profile")}
            />
            <SettingsMenuItem
              icon="lock-closed-outline"
              title="Change Password"
              onPress={() => router.push("/change-password")}
            />
            <SettingsMenuItem
              icon="shield-outline"
              title="Manage Addresses"
              onPress={() => router.push("/my-addresses")}
            />
            <SettingsMenuItem
              icon="card-outline"
              title="Payment Methods"
              showDivider={false}
              onPress={() => router.push("/payment-methods")}
            />
          </ProfileMenuSection>

          <ProfileMenuSection title="NOTIFICATIONS">
            <SettingsMenuItem
              icon="notifications-outline"
              title="Notification Preferences"
              showDivider={false}
              onPress={() => router.push("/notification-preferences")}
            />
          </ProfileMenuSection>

          <ProfileMenuSection title="PREFERENCES">
            <SettingsMenuItem
              icon="globe-outline"
              title="Language"
              subtitle={preferences.language}
            />
            <SettingsMenuItem
              icon="globe-outline"
              title="Country/Region"
              subtitle={preferences.country}
            />
            <SettingsMenuItem
              icon="card-outline"
              title="Currency"
              subtitle={preferences.currency}
              showDivider={false}
            />
          </ProfileMenuSection>
        </ScrollView>
      )}

      <AppTabBar activeTab="profile" />
    </View>
  );
}
