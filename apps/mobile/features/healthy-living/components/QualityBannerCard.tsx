import type { CatalogBanner } from "@/features/healthy-living/types/healthyLivingCatalog";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

type QualityBannerCardProps = {
  banner: CatalogBanner;
  backgroundColor: string;
};

export default function QualityBannerCard({ banner, backgroundColor }: QualityBannerCardProps) {
  return (
    <View
      className="rounded-2xl p-4 mt-2"
      style={{ backgroundColor }}
    >
      <Ionicons name={banner.icon} size={22} color={banner.iconColor} style={{ marginBottom: 8 }} />
      <Text className="text-[16px] font-bold text-black mb-2">{banner.title}</Text>
      <Text className="text-[14px] text-[#4B5563] leading-6">{banner.description}</Text>
    </View>
  );
}
