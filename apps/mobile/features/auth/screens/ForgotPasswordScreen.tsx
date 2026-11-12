import AuthTextField from "@/features/auth/components/AuthTextField";
import {
  requestPasswordReset,
  resetPasswordWithOtp,
} from "@/features/auth/services/authService";
import { showAlert } from "@/shared/utils/alert";
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

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [emailError, setEmailError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);

  const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

  const handleSendOtp = async () => {
    setEmailError("");
    setGeneralError("");

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setEmailError("Please enter your email address.");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      await requestPasswordReset(trimmedEmail);
      setEmail(trimmedEmail);
      setStep("reset");
      showAlert(
        "OTP Sent",
        "If an account exists for this email, a reset code has been sent. Please check your inbox and spam folder.",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not send reset code.";
      setGeneralError(message);
      showAlert("Request Failed", message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setOtpError("");
    setPasswordError("");
    setConfirmPasswordError("");
    setGeneralError("");

    const trimmedOtp = otp.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirm = confirmPassword.trim();
    let hasError = false;

    if (!trimmedOtp) {
      setOtpError("Please enter the code sent to your email.");
      hasError = true;
    }

    if (!trimmedPassword) {
      setPasswordError("Password is required.");
      hasError = true;
    } else if (trimmedPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      hasError = true;
    }

    if (!trimmedConfirm) {
      setConfirmPasswordError("Please confirm your password.");
      hasError = true;
    } else if (trimmedPassword !== trimmedConfirm) {
      setConfirmPasswordError("Passwords do not match.");
      hasError = true;
    }

    if (hasError) return;

    try {
      setLoading(true);
      await resetPasswordWithOtp({
        token: trimmedOtp,
        password: trimmedPassword,
      });
      showAlert(
        "Password Updated",
        "You can now login with your new password.",
        [{ text: "OK", onPress: () => router.replace("/login") }],
      );
      router.replace("/login");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not reset password.";
      setGeneralError(message);
      showAlert("Reset Failed", message);
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
              <View>
                <AuthTextField
                  icon="mail-outline"
                  placeholder="Enter your email address"
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    if (emailError) setEmailError("");
                    if (generalError) setGeneralError("");
                  }}
                  keyboardType="email-address"
                  autoComplete="email"
                />
                {emailError ? (
                  <Text className="text-[#EF4444] text-xs mt-1.5 ml-1">
                    {emailError}
                  </Text>
                ) : null}
              </View>

              {generalError ? (
                <View className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <Text className="text-[#EF4444] text-xs text-center font-medium">
                    {generalError}
                  </Text>
                </View>
              ) : null}

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

              <View className="gap-4">
                <View>
                  <AuthTextField
                    icon="key-outline"
                    placeholder="Enter OTP code"
                    value={otp}
                    onChangeText={(val) => {
                      setOtp(val);
                      if (otpError) setOtpError("");
                      if (generalError) setGeneralError("");
                    }}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                  {otpError ? (
                    <Text className="text-[#EF4444] text-xs mt-1.5 ml-1">
                      {otpError}
                    </Text>
                  ) : null}
                </View>

                <View>
                  <AuthTextField
                    icon="lock-closed-outline"
                    placeholder="New password"
                    value={password}
                    onChangeText={(val) => {
                      setPassword(val);
                      if (passwordError) setPasswordError("");
                      if (generalError) setGeneralError("");
                    }}
                    isPassword
                    autoComplete="new-password"
                  />
                  {passwordError ? (
                    <Text className="text-[#EF4444] text-xs mt-1.5 ml-1">
                      {passwordError}
                    </Text>
                  ) : null}
                </View>

                <View>
                  <AuthTextField
                    icon="lock-closed-outline"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChangeText={(val) => {
                      setConfirmPassword(val);
                      if (confirmPasswordError) setConfirmPasswordError("");
                      if (generalError) setGeneralError("");
                    }}
                    isPassword
                    autoComplete="new-password"
                  />
                  {confirmPasswordError ? (
                    <Text className="text-[#EF4444] text-xs mt-1.5 ml-1">
                      {confirmPasswordError}
                    </Text>
                  ) : null}
                </View>
              </View>

              {generalError ? (
                <View className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <Text className="text-[#EF4444] text-xs text-center font-medium">
                    {generalError}
                  </Text>
                </View>
              ) : null}

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
