import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type ProfileMenuItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showDivider?: boolean;
};

export default function ProfileMenuItem({
  icon,
  title,
  subtitle,
  onPress,
  showDivider = true,
}: ProfileMenuItemProps) {
  return (
    <>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className="flex-row items-center px-4 py-3.5"
      >
        <View className="w-9 h-9 rounded-full bg-[#FFF3E0] justify-center items-center mr-3">
          <Ionicons name={icon} size={18} color="#FF9800" />
        </View>
        <View className="flex-1">
          <Text className="text-[15px] font-semibold text-black">{title}</Text>
          {subtitle ? (
            <Text className="text-[13px] text-[#9CA3AF] mt-0.5">{subtitle}</Text>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
      </TouchableOpacity>
      {showDivider ? <View className="h-px bg-[#F0F0F0] ml-[52px]" /> : null}
    </>
  );
}
