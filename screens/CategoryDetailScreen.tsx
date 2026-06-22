import CategoryDetailHeader from "@/components/categories/CategoryDetailHeader";
import SubCategoryCard from "@/components/categories/SubCategoryCard";
import { getCategoryDetail } from "@/services/categoryService";
import type { CategoryDetailData } from "@/types/category";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function CategoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<CategoryDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    getCategoryDetail(id)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

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
        <Text className="text-[#9CA3AF] text-center mb-4">Category not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-[#FF9800] font-medium">Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const rows: (typeof data.subcategories)[] = [];
  for (let i = 0; i < data.subcategories.length; i += 2) {
    rows.push(data.subcategories.slice(i, i + 2));
  }

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <CategoryDetailHeader title={data.category.title} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 pt-4 pb-8"
      >
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} className="flex-row gap-3">
            {row.map((item) => (
              <View key={item.id} className="flex-1">
                <SubCategoryCard
                  item={item}
                  onPress={() =>
                    router.push({
                      pathname: "/categories/[id]/[subId]",
                      params: { id: data.category.id, subId: item.id },
                    })
                  }
                />
              </View>
            ))}
            {row.length === 1 ? <View className="flex-1" /> : null}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
