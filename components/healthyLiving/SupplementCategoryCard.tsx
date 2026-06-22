import type { CatalogCategory } from "@/types/healthyLivingCatalog";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type SupplementCategoryCardProps = {
  category: CatalogCategory;
  onPress?: () => void;
};

export default function SupplementCategoryCard({
  category,
  onPress,
}: SupplementCategoryCardProps) {
  const productLabel = `${category.productCount} product${category.productCount === 1 ? "" : "s"} available`;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="bg-white rounded-2xl p-4 mb-3 border border-[#F0F0F0]"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      <View className="flex-row items-start">
        <View
          className="w-12 h-12 rounded-xl justify-center items-center mr-3"
          style={{ backgroundColor: category.backgroundColor }}
        >
          <Ionicons name={category.icon} size={24} color={category.iconColor} />
        </View>
        <View className="flex-1">
          <Text className="text-[16px] font-bold text-black mb-1">{category.title}</Text>
          <Text className="text-[14px] text-[#6B7280] leading-5">{category.description}</Text>
          <Text className="text-[13px] text-[#9CA3AF] mt-2">{productLabel}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
