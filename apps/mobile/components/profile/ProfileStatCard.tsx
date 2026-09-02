import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type ProfileStatCardProps = {
  value: number;
  label: string;
  onPress?: () => void;
};

export default function ProfileStatCard({ value, label, onPress }: ProfileStatCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.85 : 1}
      disabled={!onPress}
      className="flex-1 bg-white rounded-2xl py-4 items-center"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
      }}
    >
      <Text className="text-[22px] font-bold text-[#FF9800]">{value}</Text>
      <Text className="text-[13px] text-[#9CA3AF] mt-1">{label}</Text>
    </TouchableOpacity>
  );
}
