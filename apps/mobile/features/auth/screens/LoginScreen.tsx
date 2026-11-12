import AuthTextField from "@/features/auth/components/AuthTextField";
// import SocialButton from "@/features/auth/components/SocialButton";
import { useCart } from "@/features/cart/contexts/CartContext";
import { useWishlist } from "@/features/wishlist/contexts/WishlistContext";
import { login } from "@/shared/services/api/authService";
// import { AntDesign, FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ORANGE = "#FF9800";

export default function LoginScreen() {
  const router = useRouter();
  const { refreshWishlist } = useWishlist();
  const { refreshCart } = useCart();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);

  const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

  const handleLogin = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    let hasError = false;

    setEmailError("");
    setPasswordError("");

    if (!trimmedEmail) {
      setEmailError("Email is required.");
      hasError = true;
    } else if (!isValidEmail(trimmedEmail)) {
      setEmailError("Please enter a valid email address.");
      hasError = true;
    }

    if (!trimmedPassword) {
      setPasswordError("Password is required.");
      hasError = true;
    } else if (trimmedPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      hasError = true;
    }

    if (hasError) return;

    try {
      setLoading(true);
      await login({ email: trimmedEmail, password: trimmedPassword });
      await Promise.all([refreshWishlist(), refreshCart()]);
      router.replace("/(tabs)");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to login";
      Alert.alert("Login failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1 px-6"
          contentContainerClassName="flex-grow pb-8"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center mt-8 mb-6">
            <Image
              source={require("../../../assets/images/asian-spices-logo.png")}
              style={{ width: 220, height: 140 }}
              resizeMode="contain"
              accessibilityLabel="Asian Spices logo"
            />
          </View>

          <Text className="text-[32px] font-bold text-black mb-10">
            Welcome Back!
          </Text>

          <View className="gap-4">
            <AuthTextField
              icon="person-outline"
              placeholder="Email"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                if (emailError) setEmailError("");
              }}
              keyboardType="email-address"
              autoComplete="email"
            />
            {emailError ? (
              <Text className="text-[#EF4444] text-xs -mt-2">{emailError}</Text>
            ) : null}
            <AuthTextField
              icon="lock-closed-outline"
              placeholder="Password"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                if (passwordError) setPasswordError("");
              }}
              isPassword
              autoComplete="password"
            />
            {passwordError ? (
              <Text className="text-[#EF4444] text-xs -mt-2">{passwordError}</Text>
            ) : null}
          </View>

          <TouchableOpacity
            onPress={() => router.push("/forgot-password")}
            activeOpacity={0.7}
            className="self-end mt-3"
          >
            <Text className="text-[#9CA3AF] text-sm">Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
            className="bg-[#FF9800] h-[52px] rounded-2xl justify-center items-center mt-8"
            style={{
              shadowColor: ORANGE,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 4,
              opacity: loading ? 0.7 : 1,
            }}
          >
            <Text className="text-white text-base font-semibold">
              {loading ? "Logging in..." : "Login"}
            </Text>
          </TouchableOpacity>

          {/* <Text className="text-[#9CA3AF] text-sm text-center mt-10 mb-6">
            - OR Continue with -
          </Text>

          <View className="flex-row justify-center items-center gap-5">
            <SocialButton>
              <AntDesign name="google" size={22} color="#EA4335" />
            </SocialButton>
            <SocialButton>
              <AntDesign name="apple" size={24} color="#000000" />
            </SocialButton>
            <SocialButton>
              <FontAwesome name="facebook" size={22} color="#1877F2" />
            </SocialButton>
          </View> */}

          <View className="flex-1 justify-end items-center mt-12">
            <TouchableOpacity
              onPress={() => router.push("/signup")}
              activeOpacity={0.7}
              className="flex-row items-center"
            >
              <Text className="text-[#9CA3AF] text-sm">Create An Account </Text>
              <Text className="text-[#FF9800] text-sm underline font-medium">Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
