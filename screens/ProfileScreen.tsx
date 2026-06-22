import AppHeader from "@/components/AppHeader";
import ProfileMenuItem from "@/components/profile/ProfileMenuItem";
import ProfileMenuSection from "@/components/profile/ProfileMenuSection";
import ProfileStatCard from "@/components/profile/ProfileStatCard";
import { useWishlist } from "@/contexts/WishlistContext";
import { getAddresses } from "@/services/addressService";
import { getOrders } from "@/services/orderService";
import { getSavedPaymentMethods } from "@/services/paymentMethodService";
import { getProfileData } from "@/services/profileService";
import type { UserProfile } from "@/types/profile";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";

function ProfileHeaderInfo({ user }: { user: UserProfile }) {
  return (
    <View className="flex-row items-center mt-5">
      <View className="relative mr-4">
        <Image
          source={{ uri: user.avatar }}
          style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: "#FFFFFF" }}
          contentFit="cover"
        />
        <TouchableOpacity
          activeOpacity={0.8}
          className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-[#FF9800] border-2 border-white justify-center items-center"
        >
          <Ionicons name="pencil" size={14} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      <View className="flex-1">
        <Text className="text-white text-[20px] font-bold">{user.name}</Text>
        <Text className="text-white/90 text-[14px] mt-1">{user.email}</Text>
        <Text className="text-white/90 text-[14px] mt-0.5">{user.phone}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { items: wishlistItems } = useWishlist();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [addressCount, setAddressCount] = useState(0);
  const [paymentCount, setPaymentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    const [profile, orders, addresses, payments] = await Promise.all([
      getProfileData(),
      getOrders(),
      getAddresses(),
      getSavedPaymentMethods(),
    ]);
    setUser(profile.user);
    setReviewCount(profile.reviewCount);
    setOrderCount(orders.length);
    setAddressCount(addresses.length);
    setPaymentCount(payments.length);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadProfile()
        .catch(console.error)
        .finally(() => setLoading(false));
    }, [loadProfile])
  );

  if (loading || !user) {
    return (
      <View className="flex-1 bg-[#F5F5F5] justify-center items-center">
        <ActivityIndicator size="large" color="#FF9800" />
      </View>
    );
  }

  const addressSubtitle =
    addressCount === 0
      ? "No saved addresses"
      : `${addressCount} saved address${addressCount === 1 ? "" : "es"}`;

  const paymentSubtitle =
    paymentCount === 0
      ? "No payment methods saved"
      : `${paymentCount} payment method${paymentCount === 1 ? "" : "s"} saved`;

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <AppHeader searchPlaceholder="Search spices, recipes..." contentPaddingBottom={48}>
        <ProfileHeaderInfo user={user} />
      </AppHeader>

      <View className="flex-row px-4 -mt-7 mb-4 gap-3 z-10">
        <ProfileStatCard
          value={orderCount}
          label="Orders"
          onPress={() => router.push("/my-orders")}
        />
        <ProfileStatCard
          value={wishlistItems.length}
          label="Wishlist"
          onPress={() => router.push("/wishlist")}
        />
        <ProfileStatCard value={reviewCount} label="Reviews" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-6"
        showsVerticalScrollIndicator={false}
      >
        <ProfileMenuSection title="ACCOUNT">
          <ProfileMenuItem icon="person-outline" title="Edit Profile" />
          <ProfileMenuItem
            icon="location-outline"
            title="Addresses"
            subtitle={addressSubtitle}
            onPress={() => router.push("/my-addresses")}
          />
          <ProfileMenuItem
            icon="card-outline"
            title="Payment Methods"
            subtitle={paymentSubtitle}
            onPress={() => router.push("/payment-methods")}
            showDivider={false}
          />
        </ProfileMenuSection>

        <ProfileMenuSection title="ORDERS & ACTIVITY">
          <ProfileMenuItem
            icon="cube-outline"
            title="My Orders"
            subtitle="Track and manage orders"
            onPress={() => router.push("/my-orders")}
          />
          <ProfileMenuItem
            icon="heart-outline"
            title="Wishlist"
            subtitle="Your saved items"
            onPress={() => router.push("/wishlist")}
            showDivider={false}
          />
        </ProfileMenuSection>

        <ProfileMenuSection title="SUPPORT & SETTINGS">
          <ProfileMenuItem icon="help-circle-outline" title="Help & Support" />
          <ProfileMenuItem
            icon="settings-outline"
            title="Settings"
            showDivider={false}
            onPress={() => router.push("/settings")}
          />
        </ProfileMenuSection>
      </ScrollView>
    </View>
  );
}
