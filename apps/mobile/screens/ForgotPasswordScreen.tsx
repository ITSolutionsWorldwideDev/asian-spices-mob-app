import AuthTextField from "@/components/AuthTextField";
import {
  requestPasswordReset,
  resetPasswordWithOtp,
} from "@/services/api/authService";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ORANGE = "#FF9800";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

  const handleSendOtp = async () => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      Alert.alert("Email required", "Please enter your email address.");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      await requestPasswordReset(trimmedEmail);
      setEmail(trimmedEmail);
      setStep("reset");
      Alert.alert(
        "OTP sent",
        "If an account exists for this email, a reset code has been sent.",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not send reset code.";
      Alert.alert("Request failed", message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const trimmedOtp = otp.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedOtp) {
      Alert.alert("OTP required", "Please enter the code sent to your email.");
      return;
    }

    if (trimmedPassword.length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return;
    }

    if (trimmedPassword !== trimmedConfirm) {
      Alert.alert("Password mismatch", "Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      await resetPasswordWithOtp({
        token: trimmedOtp,
        password: trimmedPassword,
      });
      Alert.alert("Password updated", "You can now login with your new password.", [
        { text: "OK", onPress: () => router.replace("/login") },
      ]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not reset password.";
      Alert.alert("Reset failed", message);
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
          contentContainerClassName="flex-grow justify-center pb-8"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-[32px] font-bold text-black mb-8 leading-tight">
            {step === "email" ? "Forgot\npassword?" : "Enter reset\ncode"}
          </Text>

          {step === "email" ? (
            <>
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
                We will send a one-time code to reset your password
              </Text>

              <TouchableOpacity
                onPress={handleSendOtp}
                disabled={loading}
                activeOpacity={0.85}
                className="bg-[#FF9800] h-[52px] rounded-2xl justify-center items-center mt-10"
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
                  {loading ? "Sending..." : "Send OTP"}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text className="text-[#6B7280] text-sm mb-4">
                Enter the 6-digit code sent to {email}
              </Text>

              <AuthTextField
                icon="key-outline"
                placeholder="Enter OTP code"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
              />

              <AuthTextField
                icon="lock-closed-outline"
                placeholder="New password"
                value={password}
                onChangeText={setPassword}
                isPassword
                autoComplete="password-new"
              />

              <AuthTextField
                icon="lock-closed-outline"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                isPassword
                autoComplete="password-new"
              />

              <TouchableOpacity
                onPress={handleResetPassword}
                disabled={loading}
                activeOpacity={0.85}
                className="bg-[#FF9800] h-[52px] rounded-2xl justify-center items-center mt-10"
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
                  {loading ? "Updating..." : "Reset Password"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setStep("email")}
                activeOpacity={0.7}
                className="mt-4 items-center"
              >
                <Text className="text-[#FF9800] text-sm font-medium">Change email</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
