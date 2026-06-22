import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  iconBg?: string;
};

export default function SectionHeader({
  title,
  subtitle,
  actionLabel = "See All",
  onActionPress,
  icon,
  iconBg = "#E8F5E9",
}: SectionHeaderProps) {
  return (
    <View className="flex-row items-start justify-between px-4 mb-3">
      <View className="flex-row items-start flex-1 mr-3">
        {icon ? (
          <View
            className="w-9 h-9 rounded-lg justify-center items-center mr-2.5 mt-0.5"
            style={{ backgroundColor: iconBg }}
          >
            <Ionicons name={icon} size={18} color="#22C55E" />
          </View>
        ) : null}
        <View className="flex-1">
          <Text className="text-[17px] font-bold text-black">{title}</Text>
          {subtitle ? (
            <Text className="text-[13px] text-[#9CA3AF] mt-0.5">{subtitle}</Text>
          ) : null}
        </View>
      </View>
      {onActionPress || actionLabel ? (
        <TouchableOpacity onPress={onActionPress} activeOpacity={0.7}>
          <Text className="text-[#FF9800] text-sm font-medium">
            {actionLabel} ›
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
