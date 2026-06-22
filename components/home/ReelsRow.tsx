import type { Reel } from "@/types/home";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

type ReelsRowProps = {
  reels: Reel[];
  onReelPress?: (reel: Reel) => void;
};

function ReelCard({
  reel,
  onPress,
}: {
  reel: Reel;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity activeOpacity={0.85} className="mr-3" onPress={onPress}>
      <View className="w-[140px] h-[220px] rounded-2xl overflow-hidden bg-[#333]">
        <Image
          source={{ uri: reel.thumbnail }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.75)"]}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            justifyContent: "space-between",
            padding: 10,
          }}
        >
          <View className="flex-row justify-between items-start">
            <View className="bg-black/50 rounded px-1.5 py-0.5">
              <Text className="text-white text-[10px]">{reel.duration}</Text>
            </View>
          </View>

          <View className="items-center absolute inset-0 justify-center">
            <View className="w-10 h-10 rounded-full bg-white/30 justify-center items-center">
              <Ionicons name="play" size={20} color="#FFFFFF" />
            </View>
          </View>

          <View>
            <View className="flex-row items-center mb-1">
              <Image
                source={{ uri: reel.chefAvatar }}
                style={{ width: 20, height: 20, borderRadius: 10 }}
              />
              <Text className="text-white text-[10px] ml-1.5">{reel.chefName}</Text>
            </View>
            <Text className="text-white text-xs font-bold" numberOfLines={1}>
              {reel.title}
            </Text>
            <View className="flex-row items-center mt-1 gap-3">
              <View className="flex-row items-center">
                <Ionicons name="eye-outline" size={11} color="#FFFFFF" />
                <Text className="text-white text-[10px] ml-0.5">{reel.views}</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="heart-outline" size={11} color="#FFFFFF" />
                <Text className="text-white text-[10px] ml-0.5">{reel.likes}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
}

export default function ReelsRow({ reels, onReelPress }: ReelsRowProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="px-4 pb-1"
    >
      {reels.map((reel) => (
        <ReelCard key={reel.id} reel={reel} onPress={() => onReelPress?.(reel)} />
      ))}
    </ScrollView>
  );
}
