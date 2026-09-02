import AppHeader from "@/components/AppHeader";
import ProfileMenuItem from "@/components/profile/ProfileMenuItem";
import ProfileMenuSection from "@/components/profile/ProfileMenuSection";
import ProfileStatCard from "@/components/profile/ProfileStatCard";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { logout } from "@/services/api/authService";
import { getAddresses } from "@/services/addressService";
import { getOrders } from "@/services/orderService";
import { getProfileData } from "@/services/profileService";
import type { UserProfile } from "@/types/profile";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
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

async function safeCount<T>(promise: Promise<T[]>, fallback = 0): Promise<number> {
  try {
    const data = await promise;
    return data.length;
  } catch {
    return fallback;
  }
}

function ProfileHeaderInfo({ user }: { user: UserProfile }) {
  return (
    <View className="flex-row items-center mt-5">
      <View className="relative mr-4">
        {user.avatar ? (
          <Image
            source={{ uri: user.avatar }}
            style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: "#FFFFFF" }}
            contentFit="cover"
          />
        ) : (
          <View
            className="justify-center items-center bg-white/20"
            style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: "#FFFFFF" }}
          >
            <Ionicons name="person" size={32} color="#FFFFFF" />
          </View>
        )}
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
  const { items: wishlistItems, resetLocalWishlist } = useWishlist();
  const { resetLocalCart } = useCart();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [addressCount, setAddressCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const loadProfile = useCallback(async () => {
    const profile = await getProfileData();
    const [ordersCount, addressesCount] = await Promise.all([
      safeCount(getOrders()),
      safeCount(getAddresses()),
    ]);

    setUser(profile.user);
    setReviewCount(profile.reviewCount);
    setOrderCount(ordersCount);
    setAddressCount(addressesCount);
    setErrorMessage(null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadProfile()
        .catch((error) => {
          console.error(error);
          setErrorMessage(error instanceof Error ? error.message : "Unable to load profile");
        })
        .finally(() => setLoading(false));
    }, [loadProfile])
  );

  const handleLogout = async () => {
    if (loggingOut) return;

    try {
      setLoggingOut(true);
      await logout();
      resetLocalWishlist();
      resetLocalCart();
      setUser(null);
      router.replace("/login");
    } catch (error) {
      console.error(error);
      Alert.alert("Logout failed", "Could not log out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#F5F5F5] justify-center items-center">
        <ActivityIndicator size="large" color="#FF9800" />
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 bg-[#F5F5F5] justify-center items-center px-6">
        <Text className="text-[#111827] text-base font-semibold text-center">Profile unavailable</Text>
        <Text className="text-[#6B7280] text-sm text-center mt-2">
          {errorMessage ?? "Please login again and try loading your profile."}
        </Text>
        <TouchableOpacity
          onPress={() => {
            setLoading(true);
            loadProfile()
              .catch((error) => {
                console.error(error);
                setErrorMessage(error instanceof Error ? error.message : "Unable to load profile");
              })
              .finally(() => setLoading(false));
          }}
          activeOpacity={0.85}
          className="bg-[#FF9800] h-[44px] px-5 rounded-xl justify-center items-center mt-5"
        >
          <Text className="text-white text-sm font-semibold">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const addressSubtitle =
    addressCount === 0
      ? "No saved addresses"
      : `${addressCount} saved address${addressCount === 1 ? "" : "es"}`;

  // Payment Methods temporarily hidden from profile/settings.
  // const paymentSubtitle =
  //   paymentCount === 0
  //     ? "No payment methods saved"
  //     : `${paymentCount} payment method${paymentCount === 1 ? "" : "s"} saved`;

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
          <ProfileMenuItem
            icon="person-outline"
            title="Edit Profile"
            onPress={() => router.push("/edit-profile")}
          />
          <ProfileMenuItem
            icon="location-outline"
            title="Addresses"
            subtitle={addressSubtitle}
            onPress={() => router.push("/my-addresses")}
            showDivider={false}
          />
          {/* <ProfileMenuItem
            icon="card-outline"
            title="Payment Methods"
            subtitle={paymentSubtitle}
            onPress={() => router.push("/payment-methods")}
            showDivider={false}
          /> */}
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
          <ProfileMenuItem
            icon="help-circle-outline"
            title="Help & Support"
            onPress={() => router.push("/help-support")}
          />
          <ProfileMenuItem
            icon="settings-outline"
            title="Settings"
            showDivider={false}
            onPress={() => router.push("/settings")}
          />
        </ProfileMenuSection>

        <TouchableOpacity
          onPress={handleLogout}
          disabled={loggingOut}
          activeOpacity={0.85}
          className="mt-2 bg-white rounded-2xl border border-[#FECACA] px-4 py-4 flex-row items-center justify-center"
        >
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          <Text className="text-[#DC2626] text-[15px] font-semibold ml-2">
            {loggingOut ? "Logging out..." : "Logout"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
