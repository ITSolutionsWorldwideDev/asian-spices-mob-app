import AppHeader from "@/shared/components/AppHeader";
import ProductListCard from "@/features/categories/components/ProductListCard";
import { fetchPopularProducts } from "@/features/home/services/searchService";
import type { CategoryProduct } from "@/features/categories/types/category";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const PAGE_SIZE = 20;

export default function TopProductsScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<CategoryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    fetchPopularProducts(1, PAGE_SIZE)
      .then((result) => {
        setProducts(result.products);
        setHasMore(result.hasMore);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;

    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const result = await fetchPopularProducts(nextPage, PAGE_SIZE);
      setProducts((current) => {
        const seen = new Set(current.map((item) => item.id));
        return [...current, ...result.products.filter((item) => !seen.has(item.id))];
      });
      setPage(nextPage);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <AppHeader searchPlaceholder="Search spices, recipes..." />

      <View className="bg-white border-b border-[#EAEAEA] py-3">
        <View className="flex-row items-center px-4">
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-9 h-9 justify-center items-center"
          >
            <Ionicons name="chevron-back" size={26} color="#333333" />
          </TouchableOpacity>
          <Text className="flex-1 text-center text-[18px] font-bold text-black mr-9">
            Top Products
          </Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#FF9800" />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
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
          ListEmptyComponent={
            <Text className="text-[#9CA3AF] text-center py-8">No products found.</Text>
          }
          ListFooterComponent={
            hasMore ? (
              <TouchableOpacity
                onPress={loadMore}
                disabled={loadingMore}
                className="mt-2 rounded-xl border border-[#FF9800] py-3 items-center"
                activeOpacity={0.85}
              >
                {loadingMore ? (
                  <ActivityIndicator size="small" color="#FF9800" />
                ) : (
                  <Text className="text-[#FF9800] text-sm font-semibold">Load More</Text>
                )}
              </TouchableOpacity>
            ) : null
          }
        />
      )}
    </View>
  );
}
