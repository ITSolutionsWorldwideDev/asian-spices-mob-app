import type { HerbBenefit } from "@/types/healthBenefits";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type BenefitCardProps = {
  benefit: HerbBenefit;
  onPress?: () => void;
};

export default function BenefitCard({ benefit, onPress }: BenefitCardProps) {
  const content = (
    <>
      <View
        className="w-12 h-12 rounded-xl justify-center items-center mr-3"
        style={{ backgroundColor: benefit.backgroundColor }}
      >
        <Ionicons name={benefit.icon} size={24} color={benefit.iconColor} />
      </View>
      <View className="flex-1">
        <Text className="text-[16px] font-bold text-black mb-1">{benefit.title}</Text>
        <Text className="text-[14px] text-[#6B7280] leading-5">{benefit.description}</Text>
      </View>
    </>
  );

  if (!onPress) {
    return (
      <View
        className="bg-white rounded-2xl p-4 mb-3 flex-row items-start"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
          elevation: 2,
        }}
      >
        {content}
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="bg-white rounded-2xl p-4 mb-3 flex-row items-start"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      {content}
    </TouchableOpacity>
  );
}
