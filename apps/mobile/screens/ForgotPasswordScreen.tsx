import AuthTextField from "@/components/AuthTextField";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ORANGE = "#FF9800";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");

  const handleSubmit = () => {
    console.log("Reset password for", email);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1 px-6"
          contentContainerClassName="flex-grow justify-center pb-8"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-[32px] font-bold text-black mb-8 leading-tight">
            Forgot{"\n"}password?
          </Text>

          <AuthTextField
            icon="mail-outline"
            placeholder="Enter your email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoComplete="email"
          />

          <Text className="text-[#9CA3AF] text-sm mt-3 leading-5">
            <Text className="text-red-500">* </Text>
            We will send you a message to set or reset your new password
          </Text>

          <TouchableOpacity
            onPress={handleSubmit}
            activeOpacity={0.85}
            className="bg-[#FF9800] h-[52px] rounded-2xl justify-center items-center mt-10"
            style={{
              shadowColor: ORANGE,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text className="text-white text-base font-semibold">Submit</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
