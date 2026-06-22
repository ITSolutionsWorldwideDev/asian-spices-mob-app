import ProductListCard from "@/components/categories/ProductListCard";
import { applyProductFilter, getSubCategoryProducts } from "@/services/categoryService";
import type { ProductFilter, SubCategoryProductsData } from "@/types/category";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const FILTERS: { key: ProductFilter; label: string }[] = [
  { key: "popular", label: "Popular" },
  { key: "lowToHigh", label: "Low to High" },
  { key: "highToLow", label: "High to Low" },
  { key: "topRated", label: "Top Rated" },
];

export default function SubCategoryProductsScreen() {
  const { id, subId } = useLocalSearchParams<{ id: string; subId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<SubCategoryProductsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ProductFilter>("popular");

  useEffect(() => {
    if (!id || !subId) {
      setLoading(false);
      return;
    }
    getSubCategoryProducts(id, subId)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, subId]);

  const filteredProducts = useMemo(() => {
    if (!data) return [];
    return applyProductFilter(data.products, filter);
  }, [data, filter]);

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
        <Text className="text-[#9CA3AF] text-center mb-4">Subcategory not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-[#FF9800] font-medium">Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <View
        className="bg-white border-b border-[#EAEAEA]"
        style={{ paddingTop: insets.top + 8, paddingBottom: 12 }}
      >
        <View className="flex-row items-center px-4">
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-9 h-9 justify-center items-center"
          >
            <Ionicons name="chevron-back" size={26} color="#333333" />
          </TouchableOpacity>
          <Text className="flex-1 text-center text-[20px] font-bold text-black mr-9">
            {data.subcategory.title}
          </Text>
          <TouchableOpacity
            className="absolute right-4 w-9 h-9 justify-center items-center"
            activeOpacity={0.8}
          >
            <Ionicons name="options-outline" size={20} color="#333333" />
          </TouchableOpacity>
        </View>

        <View className="px-4 mt-2 flex-row gap-2">
          {FILTERS.map((item) => {
            const active = filter === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                onPress={() => setFilter(item.key)}
                className={`px-3 py-2 rounded-full ${
                  active ? "bg-[#FF5A1F]" : "bg-[#E5E7EB]"
                }`}
                activeOpacity={0.8}
              >
                <Text className={`text-xs font-medium ${active ? "text-white" : "text-[#4B5563]"}`}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <Text className="text-[#6B7280] text-[16px] px-4 pt-4 pb-3">
        {filteredProducts.length} products found
      </Text>

      {filteredProducts.length === 0 ? (
        <View className="flex-1 justify-center items-center px-8">
          <Text className="text-[#9CA3AF] text-[16px] text-center">
            No products available in this category
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          renderItem={({ item }) => (
            <View className="flex-1">
              <ProductListCard
                product={item}
                onPress={() =>
                  router.push({ pathname: "/product/[id]", params: { id: item.id } })
                }
              />
            </View>
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
