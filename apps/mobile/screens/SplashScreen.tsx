import { getStoredAuthUser, refreshNextAuthSession } from "@/services/api/authService";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SplashScreen: React.FC = () => {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let isActive = true;

    (async () => {
      try {
        const storedUser = await getStoredAuthUser();
        if (storedUser) {
          // Keep the user's session alive across app restarts (like Facebook).
          refreshNextAuthSession().catch(() => {});
          if (isActive) router.replace("/(tabs)");
          return;
        }
      } catch {
        // Fall through to showing the splash screen below.
      }
      if (isActive) setCheckingSession(false);
    })();

    return () => {
      isActive = false;
    };
  }, [router]);

  const handleGetStarted = () => {
    router.push("/signup");
  };

  const handleLogin = () => {
    router.push("/login");
  };

  const handleContinueAsGuest = () => {
    router.replace("/(tabs)");
  };

  if (checkingSession) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#FF9800" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6">
        <View className="flex-1 justify-center items-center">
          <Image
            source={require("../assets/images/asian-spices-logo.png")}
            style={{ width: 280, height: 180 }}
            resizeMode="contain"
            accessibilityLabel="Asian Spices logo"
          />
        </View>

        <View
          className="items-center gap-5"
          style={{ paddingBottom: Platform.OS === "android" ? 32 : 16 }}
        >
          <TouchableOpacity
            onPress={handleGetStarted}
            activeOpacity={0.85}
            className="bg-[#FF9800] w-[85%] h-[52px] rounded-2xl justify-center items-center"
            style={{
              shadowColor: "#FF9800",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <Text className="text-white text-base font-semibold">
              Let&apos;s get started
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogin}
            activeOpacity={0.7}
            className="flex-row items-center gap-2.5"
          >
            <Text className="text-[#555555] text-sm font-normal">
              I already have an account
            </Text>
            <View className="w-7 h-7 rounded-full bg-[#FF9800] justify-center items-center">
              <Text
                className="text-white text-sm font-bold"
                style={{ marginTop: Platform.OS === "android" ? -1 : 0 }}
              >
                →
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleContinueAsGuest} activeOpacity={0.7}>
            <Text className="text-[#9CA3AF] text-sm underline">
              Continue as Guest
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default SplashScreen;
