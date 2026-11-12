import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type SettingsMenuItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showDivider?: boolean;
};

export default function SettingsMenuItem({
  icon,
  title,
  subtitle,
  onPress,
  showDivider = true,
}: SettingsMenuItemProps) {
  return (
    <>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className="flex-row items-center px-4 py-4"
      >
        <Ionicons name={icon} size={22} color="#374151" style={{ width: 28 }} />
        <View className="flex-1 ml-2">
          <Text className="text-[15px] font-medium text-black">{title}</Text>
          {subtitle ? (
            <Text className="text-[13px] text-[#9CA3AF] mt-0.5">{subtitle}</Text>
          ) : null}
        </View>
        {onPress ? (
          <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
        ) : null}
      </TouchableOpacity>
      {showDivider ? <View className="h-px bg-[#F0F0F0] ml-[52px]" /> : null}
    </>
  );
}
