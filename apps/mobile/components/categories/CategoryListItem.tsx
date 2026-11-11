import type { CategoryItem } from "@/types/category";
import { resolveCategoryImage } from "@/services/categoryImages";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type CategoryListItemProps = {
  item: CategoryItem;
  onPress?: () => void;
};

export default function CategoryListItem({ item, onPress }: CategoryListItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="flex-row items-center bg-white rounded-2xl border border-[#F0F0F0] p-3 mb-3 mx-4"
    >
      <Image
        source={resolveCategoryImage(item.id, item.title, item.image)}
        style={{ width: 72, height: 72, borderRadius: 12 }}
        contentFit="cover"
      />

      <View className="flex-1 ml-3 mr-2">
        <Text className="text-[15px] font-bold text-black">
          {item.emoji} {item.title}
        </Text>
        <Text className="text-[12px] text-[#9CA3AF] mt-0.5" numberOfLines={1}>
          {item.description}
        </Text>
        <Text className="text-[#FF9800] text-[12px] font-semibold mt-1">
          {item.productCount} products
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
    </TouchableOpacity>
  );
}
