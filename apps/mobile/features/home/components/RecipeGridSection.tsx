import type { Recipe } from "@/features/home/types/home";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import SectionHeader from "./SectionHeader";

type RecipeGridSectionProps = {
  title: string;
  subtitle?: string;
  recipes: Recipe[];
  onSeeAllPress?: () => void;
};

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const router = useRouter();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      className="bg-white rounded-2xl border border-[#F0F0F0] overflow-hidden mb-3 flex-1"
      onPress={() =>
        router.push({ pathname: "/recipe/[id]", params: { id: recipe.id } })
      }
    >
      <View className="relative">
        <Image
          source={{ uri: recipe.image }}
          style={{ width: "100%", height: 110 }}
          contentFit="cover"
        />
        {recipe.time ? (
          <View className="absolute top-2 left-2 bg-[#FF9800] rounded-full px-2 py-0.5">
            <Text className="text-white text-[10px] font-semibold">{recipe.time}</Text>
          </View>
        ) : null}
        {recipe.difficulty ? (
          <View className="absolute top-2 right-2 bg-black/60 rounded-full px-2 py-0.5">
            <Text className="text-white text-[10px] font-semibold">
              {recipe.difficulty}
            </Text>
          </View>
        ) : null}
      </View>
      <View className="p-2.5">
        <Text className="text-[13px] font-semibold text-black" numberOfLines={1}>
          {recipe.title}:
        </Text>
        <Text className="text-[11px] leading-5 text-[#6B7280] mt-1" numberOfLines={3}>
          {recipe.description || "Delicious recipe from our kitchen."}
        </Text>
        <View className="flex-row items-center mt-1.5">
          {recipe.reviews > 0 ? (
            <>
              <Ionicons name="star" size={12} color="#FBBF24" />
              <Text className="text-[11px] text-[#6B7280] ml-1">
                {recipe.rating.toFixed(1)} ({recipe.reviews})
              </Text>
            </>
          ) : null}
        </View>
        {recipe.servings ? (
          <Text className="text-[11px] text-[#9CA3AF] mt-0.5">
            {recipe.servings} servings
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export default function RecipeGridSection({
  title,
  subtitle,
  recipes,
  onSeeAllPress,
}: RecipeGridSectionProps) {
  const rows: Recipe[][] = [];
  for (let i = 0; i < recipes.length; i += 2) {
    rows.push(recipes.slice(i, i + 2));
  }

  return (
    <View className="py-4">
      <SectionHeader
        title={title}
        subtitle={subtitle}
        actionLabel={onSeeAllPress ? "See All" : undefined}
        onActionPress={onSeeAllPress}
      />
      <View className="px-4">
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} className="flex-row gap-3">
            {row.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
            {row.length === 1 ? <View className="flex-1" /> : null}
          </View>
        ))}
      </View>
    </View>
  );
}
