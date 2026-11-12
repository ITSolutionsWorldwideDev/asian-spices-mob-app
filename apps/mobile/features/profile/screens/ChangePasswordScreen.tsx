import AppTabBar from "@/shared/components/AppTabBar";
import PasswordFormField from "@/features/profile/components/PasswordFormField";
import { ApiRequestError } from "@/shared/services/api/httpClient";
import { changePassword } from "@/features/profile/services/profileService";
import {
  PASSWORD_REQUIREMENTS,
  isReusedCurrentPassword,
  validatePassword,
} from "@/shared/utils/passwordValidation";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ChangePasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleUpdate = async () => {
    if (!currentPassword.trim()) {
      Alert.alert("Missing information", "Please enter your current password.");
      return;
    }
    if (!newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert("Missing information", "Please enter and confirm your new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Passwords do not match", "New password and confirmation must match.");
      return;
    }
    if (isReusedCurrentPassword(currentPassword, newPassword)) {
      Alert.alert(
        "Password reused",
        "New password must be different from your current password."
      );
      return;
    }

    const validationError = validatePassword(newPassword);
    if (validationError) {
      Alert.alert("Weak password", validationError);
      return;
    }

    setSaving(true);
    try {
      await changePassword({
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
      });
      Alert.alert("Password updated", "Your password has been changed successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : "Could not update password. Please try again.";
      Alert.alert("Error", message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
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
            Change Password
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pt-6 pb-6"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center mb-8">
            <View className="w-20 h-20 rounded-full bg-[#FFF3E0] justify-center items-center mb-4">
              <Ionicons name="lock-closed-outline" size={36} color="#FF9800" />
            </View>
            <Text className="text-[#6B7280] text-[14px] text-center leading-5 px-4">
              Choose a strong password to keep your account secure
            </Text>
          </View>

          <PasswordFormField
            label="Current Password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter current password"
          />
          <PasswordFormField
            label="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Enter new password"
            helperText="Must be at least 8 characters"
          />
          <PasswordFormField
            label="Confirm New Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
          />

          <View className="bg-[#F9FAFB] rounded-xl p-4 mb-6">
            <Text className="text-[14px] font-semibold text-[#374151] mb-2">
              Password requirements:
            </Text>
            {PASSWORD_REQUIREMENTS.map((requirement) => (
              <View key={requirement} className="flex-row items-start mb-1.5">
                <Text className="text-[#6B7280] text-[13px] mr-2">•</Text>
                <Text className="flex-1 text-[#6B7280] text-[13px] leading-5">
                  {requirement}
                </Text>
              </View>
            ))}
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => router.back()}
              className="flex-1 h-[52px] rounded-xl border border-[#E5E7EB] justify-center items-center bg-white"
              activeOpacity={0.8}
            >
              <Text className="text-[15px] font-semibold text-black">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleUpdate}
              disabled={saving}
              className="flex-1 h-[52px] rounded-xl justify-center items-center bg-[#FF9800]"
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-[15px] font-semibold text-white">Update Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <AppTabBar activeTab="profile" />
    </View>
  );
}
