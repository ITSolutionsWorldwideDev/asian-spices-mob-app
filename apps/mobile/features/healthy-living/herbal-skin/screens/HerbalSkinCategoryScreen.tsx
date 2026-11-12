import AppTabBar from "@/shared/components/AppTabBar";
import SupplementProductCard from "@/features/healthy-living/components/SupplementProductCard";
import {
  getHerbalSkinProductsTheme,
  getSkinCategoryProducts,
} from "@/features/healthy-living/herbal-skin/services/herbalSkinProductProductsService";
import type { CatalogCategoryProducts } from "@/features/healthy-living/types/healthyLivingCatalog";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HerbalSkinCategoryScreen() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState<CatalogCategoryProducts | null>(null);
  const [theme, setTheme] = useState<Awaited<ReturnType<typeof getHerbalSkinProductsTheme>> | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!categoryId) {
      setLoading(false);
      return;
    }
    Promise.all([getSkinCategoryProducts(categoryId), getHerbalSkinProductsTheme()])
      .then(([categoryData, themeData]) => {
        setCategory(categoryData);
        setTheme(themeData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [categoryId]);

  if (loading || !category || !theme) {
    return (
      <View className="flex-1 bg-[#F5F5F5] justify-center items-center">
        <ActivityIndicator size="large" color="#FF9800" />
      </View>
    );
  }

  const productCountLabel = `${category.products.length} product${category.products.length === 1 ? "" : "s"} available`;

  return (
    <View className="flex-1" style={{ backgroundColor: theme.screenBackgroundColor }}>
      <LinearGradient
        colors={theme.headerGradient}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{ paddingTop: insets.top + 8, paddingBottom: 20, paddingHorizontal: 16 }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className="w-9 h-9 justify-center items-center mb-3"
        >
          <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-white text-[24px] font-bold leading-8">{category.title}</Text>
        <Text className="text-white/90 text-[14px] mt-1">{productCountLabel}</Text>
      </LinearGradient>

      <FlatList
        data={category.products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View className="flex-1">
            <SupplementProductCard product={item} />
          </View>
        )}
      />

      <AppTabBar activeTab="home" />
    </View>
  );
}
