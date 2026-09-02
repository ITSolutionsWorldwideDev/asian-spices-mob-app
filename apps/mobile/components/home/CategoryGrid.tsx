import type { Category } from "@/types/home";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type CategoryGridProps = {
  categories: Category[];
  onCategoryPress?: (category: Category) => void;
};

export default function CategoryGrid({ categories, onCategoryPress }: CategoryGridProps) {
  return (
    <View className="px-4">
      <View className="flex-row flex-wrap justify-between gap-y-3">
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            activeOpacity={0.7}
            className="w-[22%] items-center"
            onPress={() => onCategoryPress?.(category)}
          >
            <View className="w-[60px] h-[60px] rounded-2xl bg-white border border-[#F0F0F0] justify-center items-center">
              <Ionicons
                name={category.icon as keyof typeof Ionicons.glyphMap}
                size={26}
                color="#FF9800"
              />
            </View>
            <Text
              className="text-[11px] text-[#333333] mt-1.5 text-center"
              numberOfLines={2}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
