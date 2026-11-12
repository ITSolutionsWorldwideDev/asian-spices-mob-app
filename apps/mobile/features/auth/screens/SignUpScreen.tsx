import AuthTextField from "@/features/auth/components/AuthTextField";
// import SocialButton from "@/features/auth/components/SocialButton";
import { signup } from "@/features/auth/services/authService";
// import { AntDesign, FontAwesome } from "@expo/vector-icons";
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

export default function SignUpScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);

  const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

  const handleCreateAccount = async () => {
    setNameError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");
    setGeneralError("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    let hasError = false;

    if (!trimmedName) {
      setNameError("Full name is required.");
      hasError = true;
    }

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

    if (!trimmedConfirmPassword) {
      setConfirmPasswordError("Please confirm your password.");
      hasError = true;
    } else if (trimmedPassword !== trimmedConfirmPassword) {
      setConfirmPasswordError("Passwords do not match.");
      hasError = true;
    }

    if (hasError) {
      return;
    }

    try {
      setLoading(true);
      await signup({
        name: trimmedName,
        email: trimmedEmail,
        password: trimmedPassword,
        confirmPassword: trimmedConfirmPassword,
      });

      showAlert("Success", "Account created successfully.", [
        {
          text: "OK",
          onPress: () => router.replace("/login"),
        },
      ]);
      router.replace("/login");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to create account";
      setGeneralError(message);
      showAlert("Signup failed", message);
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
          <Text className="text-[32px] font-bold text-black mt-10 mb-10 leading-tight">
            Create an{"\n"}account
          </Text>

          <View className="gap-4">
            <View>
              <AuthTextField
                icon="person-outline"
                placeholder="Full Name"
                value={name}
                onChangeText={(val) => {
                  setName(val);
                  if (nameError) setNameError("");
                  if (generalError) setGeneralError("");
                }}
                autoComplete="name"
              />
              {nameError ? (
                <Text className="text-[#EF4444] text-xs mt-1.5 ml-1">
                  {nameError}
                </Text>
              ) : null}
            </View>

            <View>
              <AuthTextField
                icon="mail-outline"
                placeholder="Email"
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

            <View>
              <AuthTextField
                icon="lock-closed-outline"
                placeholder="Password"
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
                placeholder="Confirm Password"
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

          <Text className="text-[#9CA3AF] text-sm mt-5 leading-5">
            By clicking the <Text className="text-[#FF9800] font-medium">Register</Text> button,
            you agree to the public offer
          </Text>

          <TouchableOpacity
            onPress={handleCreateAccount}
            disabled={loading}
            activeOpacity={0.85}
            className="bg-[#FF9800] h-[52px] rounded-2xl justify-center items-center mt-6"
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
              {loading ? "Creating..." : "Create Account"}
            </Text>
          </TouchableOpacity>

          <View className="flex-1 justify-end items-center mt-10">
            <TouchableOpacity
              onPress={() => router.push("/login")}
              activeOpacity={0.7}
              className="flex-row items-center"
            >
              <Text className="text-[#9CA3AF] text-sm">I Already Have an Account </Text>
              <Text className="text-[#FF9800] text-sm font-medium">Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
