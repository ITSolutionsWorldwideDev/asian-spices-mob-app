import AppHeader from "@/components/AppHeader";
import CategoryListItem from "@/components/categories/CategoryListItem";
import { getCategoriesData } from "@/services/categoryService";
import type { CategoriesPageData } from "@/types/category";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  View,
} from "react-native";

export default function CategoriesScreen() {
  const router = useRouter();
  const [data, setData] = useState<CategoriesPageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCategoriesData()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View className="flex-1 bg-[#F5F5F5] justify-center items-center">
        <ActivityIndicator size="large" color="#FF9800" />
      </View>
    );
  }

  if (!data) {
    return (
      <View className="flex-1 bg-[#F5F5F5] justify-center items-center px-8">
        <Text className="text-[#9CA3AF] text-center">
          Failed to load categories.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <AppHeader searchPlaceholder="Search spices, recipes..." />

      <LinearGradient
        colors={["#FF9800", "#E53935"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 }}
      >
        <Text className="text-white text-[26px] font-bold">{data.pageTitle}</Text>
        <Text className="text-white/90 text-sm mt-1">{data.pageSubtitle}</Text>
      </LinearGradient>

      <FlatList
        data={data.categories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CategoryListItem
            item={item}
            onPress={() =>
              router.push({
                pathname: "/categories/[id]",
                params: { id: item.id },
              })
            }
          />
        )}
        contentContainerClassName="pt-4 pb-6"
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
