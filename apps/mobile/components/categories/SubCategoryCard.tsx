import type { SubCategoryItem } from "@/types/category";
import { resolveCategoryImage } from "@/services/categoryImages";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type SubCategoryCardProps = {
  item: SubCategoryItem;
  onPress?: () => void;
};

export default function SubCategoryCard({ item, onPress }: SubCategoryCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="flex-1 bg-white rounded-2xl border border-[#F0F0F0] overflow-hidden mb-3"
    >
      <View className="relative h-[130px]">
        <Image
          source={resolveCategoryImage(item.id, item.title, item.image)}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.75)"]}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            paddingHorizontal: 10,
            paddingVertical: 10,
          }}
        >
          <Text className="text-white text-[14px] font-bold">{item.title}</Text>
          <Text className="text-white/85 text-[11px] mt-0.5">
            {item.productCount} products
          </Text>
        </LinearGradient>
      </View>

      <View className="flex-row items-center justify-between px-3 py-2.5">
        <Text className="text-[13px] font-medium text-black">View Products</Text>
        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );
}
