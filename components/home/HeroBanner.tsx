import type { Hero } from "@/types/home";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Text, View } from "react-native";

type HeroBannerProps = {
  hero: Hero;
};

export default function HeroBanner({ hero }: HeroBannerProps) {
  return (
    <View className="mx-4 mt-4 mb-2 rounded-2xl overflow-hidden min-h-[160px]">
      <Image
        source={{ uri: hero.image }}
        style={{ position: "absolute", width: "100%", height: "100%" }}
        contentFit="cover"
      />
      <LinearGradient
        colors={["rgba(255,152,0,0.85)", "rgba(229,57,53,0.85)"]}
        style={{ padding: 20, minHeight: 160, justifyContent: "center" }}
      >
        <Text className="text-white text-[22px] font-bold leading-7">
          {hero.title}
        </Text>
        <Text className="text-white/90 text-sm mt-1">{hero.subtitle}</Text>
        <View className="self-start bg-[#FFD54F] rounded-lg px-3 py-1.5 mt-3">
          <Text className="text-black text-xs font-bold">{hero.promo}</Text>
        </View>
      </LinearGradient>
    </View>
  );
}
