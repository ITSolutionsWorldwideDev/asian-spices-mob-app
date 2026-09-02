import AppTabBar from "@/components/AppTabBar";
import PasswordFormField from "@/components/profile/PasswordFormField";
import ProfileFormField from "@/components/profile/ProfileFormField";
import {
  changePassword,
  getUserProfile,
  saveUserProfile,
} from "@/services/profileService";
import type { UserProfile } from "@/types/profile";
import { PASSWORD_REQUIREMENTS, isReusedCurrentPassword, validatePassword } from "@/utils/passwordValidation";
import { ApiRequestError } from "@/services/api/httpClient";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    getUserProfile()
      .then((profile) => {
        setName(profile.name);
        setEmail(profile.email);
        setPhone(profile.phone);
        setAvatar(profile.avatar);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Please allow access to your photo library.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const photo = result.assets[0];
      setAvatar(
        photo.base64 ? `data:image/jpeg;base64,${photo.base64}` : photo.uri,
      );
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert("Missing information", "Please fill in your name and phone number.");
      return;
    }

    setSaving(true);
    try {
      const profile: UserProfile = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        avatar,
      };
      await saveUserProfile(profile);
      Alert.alert("Profile updated", "Your profile changes were saved successfully.");
    } catch (error) {
      console.error(error);
      const message =
        error instanceof ApiRequestError && error.status === 401
          ? "Please login again to update your profile."
          : error instanceof Error
            ? error.message
            : "Could not save your profile. Please try again.";
      Alert.alert("Error", message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
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

    setUpdatingPassword(true);
    try {
      await changePassword({
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      Alert.alert("Password updated", "Your password has been changed successfully.");
    } catch (error) {
      console.error(error);
      const message =
        error instanceof ApiRequestError
          ? error.message
          : "Could not update password. Please try again.";
      Alert.alert("Error", message);
    } finally {
      setUpdatingPassword(false);
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
            Edit Profile
          </Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#FF9800" />
        </View>
      ) : (
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
              <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.85}>
                <View className="relative">
                  {avatar ? (
                    <Image
                      source={{ uri: avatar }}
                      style={{ width: 112, height: 112, borderRadius: 56 }}
                      contentFit="cover"
                    />
                  ) : (
                    <LinearGradient
                      colors={["#FF9800", "#E53935"]}
                      start={{ x: 0.5, y: 0 }}
                      end={{ x: 0.5, y: 1 }}
                      style={{
                        width: 112,
                        height: 112,
                        borderRadius: 56,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Ionicons name="person-outline" size={48} color="#FFFFFF" />
                    </LinearGradient>
                  )}
                  <View className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-[#FF9800] border-2 border-white justify-center items-center">
                    <Ionicons name="camera" size={18} color="#FFFFFF" />
                  </View>
                </View>
              </TouchableOpacity>
              <Text className="text-[#9CA3AF] text-[13px] mt-3">
                Click to change profile photo
              </Text>
            </View>

            <ProfileFormField
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
            />
            <ProfileFormField
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <ProfileFormField
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
            />

            <View className="flex-row gap-3 mt-2 mb-8">
              <TouchableOpacity
                onPress={() => router.back()}
                className="flex-1 h-[52px] rounded-xl border border-[#E5E7EB] justify-center items-center bg-white"
                activeOpacity={0.8}
              >
                <Text className="text-[15px] font-semibold text-black">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                className="flex-1 h-[52px] rounded-xl justify-center items-center bg-[#FF9800]"
                activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-[15px] font-semibold text-white">Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>

            <View className="h-px bg-[#F0F0F0] mb-6" />

            <Text className="text-[16px] font-bold text-black mb-1">Change Password</Text>
            <Text className="text-[#6B7280] text-[13px] mb-4">
              Update your account password securely
            </Text>

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

            <View className="bg-[#F9FAFB] rounded-xl p-4 mb-5">
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

            <TouchableOpacity
              onPress={handleUpdatePassword}
              disabled={updatingPassword}
              className="h-[52px] rounded-xl justify-center items-center bg-[#FF9800]"
              activeOpacity={0.85}
            >
              {updatingPassword ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-[15px] font-semibold text-white">Update Password</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      <AppTabBar activeTab="profile" />
    </View>
  );
}
