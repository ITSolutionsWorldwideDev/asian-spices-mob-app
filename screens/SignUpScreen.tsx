import AuthTextField from "@/components/AuthTextField";
import SocialButton from "@/components/SocialButton";
import { AntDesign, FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ORANGE = "#FF9800";

export default function SignUpScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleCreateAccount = () => {
    console.log("Create account", { email, password, confirmPassword });
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
          <Text className="text-[32px] font-bold text-black mt-10 mb-10 leading-tight">
            Create an{"\n"}account
          </Text>

          <View className="gap-4">
            <AuthTextField
              icon="person-outline"
              placeholder="Username or Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoComplete="email"
            />
            <AuthTextField
              icon="lock-closed-outline"
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              isPassword
              autoComplete="new-password"
            />
            <AuthTextField
              icon="lock-closed-outline"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              isPassword
              autoComplete="new-password"
            />
          </View>

          <Text className="text-[#9CA3AF] text-sm mt-5 leading-5">
            By clicking the{" "}
            <Text className="text-[#FF9800] font-medium">Register</Text> button,
            you agree to the public offer
          </Text>

          <TouchableOpacity
            onPress={handleCreateAccount}
            activeOpacity={0.85}
            className="bg-[#FF9800] h-[52px] rounded-2xl justify-center items-center mt-6"
            style={{
              shadowColor: ORANGE,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text className="text-white text-base font-semibold">
              Create Account
            </Text>
          </TouchableOpacity>

          <Text className="text-[#9CA3AF] text-sm text-center mt-8 mb-6">
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
          </View>

          <View className="flex-1 justify-end items-center mt-10">
            <TouchableOpacity
              onPress={() => router.push("/login")}
              activeOpacity={0.7}
              className="flex-row items-center"
            >
              <Text className="text-[#9CA3AF] text-sm">
                I Already Have an Account{" "}
              </Text>
              <Text className="text-[#FF9800] text-sm font-medium">Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
