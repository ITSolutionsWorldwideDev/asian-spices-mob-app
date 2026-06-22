import React from "react";
import { Text, View } from "react-native";

type ProfileMenuSectionProps = {
  title: string;
  children: React.ReactNode;
};

export default function ProfileMenuSection({ title, children }: ProfileMenuSectionProps) {
  return (
    <View className="mb-5">
      <Text className="text-[12px] font-bold text-[#9CA3AF] tracking-wide mb-2 px-1">
        {title}
      </Text>
      <View className="bg-white rounded-2xl overflow-hidden border border-[#F0F0F0]">
        {children}
      </View>
    </View>
  );
}
