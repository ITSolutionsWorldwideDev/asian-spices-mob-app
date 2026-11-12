import type { NotificationPreferenceItem } from "@/features/profile/types/notificationPreferences";
import React from "react";
import { Switch, Text, View } from "react-native";

type NotificationToggleItemProps = {
  item: NotificationPreferenceItem;
  value: boolean;
  onValueChange: (value: boolean) => void;
  showDivider?: boolean;
  disabled?: boolean;
};

export default function NotificationToggleItem({
  item,
  value,
  onValueChange,
  showDivider = true,
  disabled = false,
}: NotificationToggleItemProps) {
  return (
    <>
      <View className="flex-row items-center justify-between px-4 py-3.5">
        <View className="flex-1 pr-4">
          <Text className="text-[15px] font-semibold text-black">{item.title}</Text>
          <Text className="text-[13px] text-[#9CA3AF] mt-0.5 leading-5">{item.subtitle}</Text>
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          trackColor={{ false: "#E5E7EB", true: "#111827" }}
          thumbColor="#FFFFFF"
          ios_backgroundColor="#E5E7EB"
        />
      </View>
      {showDivider ? <View className="h-px bg-[#F0F0F0] ml-4" /> : null}
    </>
  );
}
