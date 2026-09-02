import ComingSoonCategory from "@/components/categories/ComingSoonCategory";
import ProductListCard from "@/components/categories/ProductListCard";
import {
  applyProductFilter,
  cacheDbProducts,
  CATEGORY_PRODUCTS_PAGE_SIZE,
  enrichProductsWithRatings,
  getSubCategoryProducts,
} from "@/services/categoryService";
import type { CategoryProduct, ProductFilter, SubCategoryProductsData } from "@/types/category";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const FILTERS: { key: NonNullable<ProductFilter>; label: string }[] = [
  { key: "popular", label: "Popular" },
  { key: "lowToHigh", label: "Low to High" },
  { key: "highToLow", label: "High to Low" },
  { key: "topRated", label: "Top Rated" },
];

const FILTER_DROPDOWN_MAX_HEIGHT = 220;

function formatCategoryTitle(title: string) {
  return title.replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function SubCategoryProductsScreen() {
  const { id, subId } = useLocalSearchParams<{ id: string; subId: string }>();
  const router = useRouter();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<SubCategoryProductsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ProductFilter>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedSubcategoryIds, setSelectedSubcategoryIds] = useState<string[]>([]);
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);
  const [subcategoryDropdownOpen, setSubcategoryDropdownOpen] = useState(false);
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const prefetchedRef = useRef<{
    page: number;
    products: CategoryProduct[];
    hasMore: boolean;
  } | null>(null);
  const prefetchingRef = useRef(false);
  const enrichedProductIdsRef = useRef<Set<string>>(new Set());
  const enrichingProductIdsRef = useRef<Set<string>>(new Set());

  const isAllView = subId === "all";

  const productQueryOptions = (pageNum: number) => ({
    search: searchTerm,
    minPrice,
    maxPrice,
    brandIds: selectedBrandIds,
    subcategoryIds: selectedSubcategoryIds,
    limit: CATEGORY_PRODUCTS_PAGE_SIZE,
    page: pageNum,
  });

  const prefetchNextPage = (currentPage: number) => {
    if (!id || !subId || prefetchingRef.current) return;

    const nextPage = currentPage + 1;
    if (prefetchedRef.current?.page === nextPage) return;

    prefetchingRef.current = true;
    getSubCategoryProducts(id, subId, productQueryOptions(nextPage))
      .then((result) => {
        if (result?.products.length) {
          prefetchedRef.current = {
            page: nextPage,
            products: result.products,
            hasMore: result.hasMore ?? false,
          };
        }
      })
      .catch(() => {})
      .finally(() => {
        prefetchingRef.current = false;
      });
  };

  const applyFilters = () => {
    setSearchTerm(searchInput.trim());
    setMinPrice(minPriceInput.trim());
    setMaxPrice(maxPriceInput.trim());
  };

  useEffect(() => {
    if (!id || !subId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setPage(1);
    prefetchedRef.current = null;
    enrichedProductIdsRef.current.clear();
    enrichingProductIdsRef.current.clear();
    getSubCategoryProducts(id, subId, productQueryOptions(1))
      .then((result) => {
        setData(result);
        const nextHasMore = result?.hasMore ?? false;
        setHasMore(nextHasMore);
        if (nextHasMore) {
          prefetchNextPage(1);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, subId, searchTerm, minPrice, maxPrice, selectedBrandIds, selectedSubcategoryIds]);

  useEffect(() => {
    if (!isFocused || loading || !data?.products.length) return;

    const productsToEnrich = data.products.filter(
      (product) =>
        !enrichedProductIdsRef.current.has(product.id) &&
        !enrichingProductIdsRef.current.has(product.id),
    );
    if (productsToEnrich.length === 0) return;

    productsToEnrich.forEach((product) => {
      enrichingProductIdsRef.current.add(product.id);
    });

    let cancelled = false;

    enrichProductsWithRatings(productsToEnrich)
      .then((enrichedProducts) => {
        if (cancelled) return;

        enrichedProducts.forEach((product) => {
          enrichedProductIdsRef.current.add(product.id);
        });
        cacheDbProducts(enrichedProducts);

        const enrichedById = new Map(
          enrichedProducts.map((product) => [product.id, product]),
        );

        setData((current) => {
          if (!current) return current;

          return {
            ...current,
            products: current.products.map(
              (product) => enrichedById.get(product.id) ?? product,
            ),
          };
        });
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        productsToEnrich.forEach((product) => {
          enrichingProductIdsRef.current.delete(product.id);
        });
      });

    return () => {
      cancelled = true;
      productsToEnrich.forEach((product) => {
        enrichingProductIdsRef.current.delete(product.id);
      });
    };
  }, [isFocused, loading, data?.products]);

  const loadMore = async () => {
    if (!id || !subId || loadingMore || !hasMore) return;

    const nextPage = page + 1;
    const cached = prefetchedRef.current?.page === nextPage ? prefetchedRef.current : null;

    if (cached) {
      prefetchedRef.current = null;
      setData((current) =>
        current
          ? { ...current, products: [...current.products, ...cached.products] }
          : null,
      );
      setPage(nextPage);
      setHasMore(cached.hasMore);
      if (cached.hasMore) {
        prefetchNextPage(nextPage);
      }
      return;
    }

    setLoadingMore(true);
    try {
      const result = await getSubCategoryProducts(id, subId, productQueryOptions(nextPage));

      if (result) {
        setData((current) =>
          current
            ? { ...current, products: [...current.products, ...result.products] }
            : result,
        );
        setPage(nextPage);
        const nextHasMore = result.hasMore ?? false;
        setHasMore(nextHasMore);
        if (nextHasMore) {
          prefetchNextPage(nextPage);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMore(false);
    }
  };

  const showLess = () => {
    prefetchedRef.current = null;
    setData((current) => {
      if (!current) return current;

      setHasMore(
        current.category.productCount > CATEGORY_PRODUCTS_PAGE_SIZE ||
          current.products.length > CATEGORY_PRODUCTS_PAGE_SIZE,
      );

      return {
        ...current,
        products: current.products.slice(0, CATEGORY_PRODUCTS_PAGE_SIZE),
      };
    });
    setPage(1);
    prefetchNextPage(1);
  };

  useEffect(() => {
    setSelectedBrandIds([]);
  }, [selectedSubcategoryIds, id, subId]);

  const filteredProducts = useMemo(() => {
    if (!data) return [];
    return applyProductFilter(data.products, filter);
  }, [data, filter]);

  const selectedSubcategoriesLabel =
    selectedSubcategoryIds.length === 0
      ? "All subcategories"
      : `${selectedSubcategoryIds.length} selected`;
  const selectedBrandsLabel =
    selectedBrandIds.length === 0 ? "All brands" : `${selectedBrandIds.length} selected`;

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

  const hasActiveFilters =
    searchTerm.length > 0 ||
    minPrice.length > 0 ||
    maxPrice.length > 0 ||
    selectedBrandIds.length > 0 ||
    selectedSubcategoryIds.length > 0;
  const isEmptyCategory = data.products.length === 0 && !hasActiveFilters;

  if (isEmptyCategory) {
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
              {formatCategoryTitle(data.category.title)}
            </Text>
          </View>
        </View>

        <ComingSoonCategory
          category={data.category}
          subcategoryTitle={isAllView ? undefined : data.subcategory.title}
        />
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
            {formatCategoryTitle(data.subcategory.title)}
          </Text>
          <TouchableOpacity
            className="absolute right-4 w-9 h-9 justify-center items-center"
            activeOpacity={0.8}
            onPress={() => {
              setSearchInput("");
              setSearchTerm("");
              setMinPriceInput("");
              setMaxPriceInput("");
              setMinPrice("");
              setMaxPrice("");
              setSelectedBrandIds([]);
              setSelectedSubcategoryIds([]);
              setSubcategoryDropdownOpen(false);
              setBrandDropdownOpen(false);
            }}
          >
            <Ionicons name="refresh-outline" size={20} color="#333333" />
          </TouchableOpacity>
        </View>

        <View className="px-4 mt-2">
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder="Search products..."
            placeholderTextColor="#9CA3AF"
            className="bg-[#F3F4F6] rounded-xl px-3 py-2 text-[14px] text-black"
            returnKeyType="search"
            onSubmitEditing={applyFilters}
          />
          <View className="flex-row gap-2 mt-2">
            <TextInput
              value={minPriceInput}
              onChangeText={setMinPriceInput}
              placeholder="Min price"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              className="flex-1 bg-[#F3F4F6] rounded-xl px-3 py-2 text-[13px] text-black"
            />
            <TextInput
              value={maxPriceInput}
              onChangeText={setMaxPriceInput}
              placeholder="Max price"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              className="flex-1 bg-[#F3F4F6] rounded-xl px-3 py-2 text-[13px] text-black"
            />
            <TouchableOpacity
              onPress={applyFilters}
              className="bg-[#FF5A1F] rounded-xl px-4 justify-center items-center"
              activeOpacity={0.8}
            >
              <Text className="text-white text-xs font-semibold">Apply</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="px-4 mt-2 gap-2">
          <View className="flex-row gap-2">
            {isAllView && (data.availableSubcategories?.length ?? 0) > 0 ? (
              <TouchableOpacity
                onPress={() => setSubcategoryDropdownOpen((prev) => !prev)}
                className="flex-1 bg-[#F3F4F6] rounded-xl px-3 py-2.5 flex-row items-center justify-between"
                activeOpacity={0.8}
              >
                <Text className="text-[13px] text-[#111827] font-medium" numberOfLines={1}>
                  {selectedSubcategoriesLabel}
                </Text>
                <Ionicons
                  name={subcategoryDropdownOpen ? "chevron-up" : "chevron-down"}
                  size={16}
                  color="#374151"
                />
              </TouchableOpacity>
            ) : null}

            {(data.availableBrands?.length ?? 0) > 0 ? (
              <TouchableOpacity
                onPress={() => setBrandDropdownOpen((prev) => !prev)}
                className="flex-1 bg-[#F3F4F6] rounded-xl px-3 py-2.5 flex-row items-center justify-between"
                activeOpacity={0.8}
              >
                <Text className="text-[13px] text-[#111827] font-medium" numberOfLines={1}>
                  Brands: {selectedBrandsLabel}
                </Text>
                <Ionicons
                  name={brandDropdownOpen ? "chevron-up" : "chevron-down"}
                  size={16}
                  color="#374151"
                />
              </TouchableOpacity>
            ) : null}
          </View>

          {isAllView && subcategoryDropdownOpen ? (
            <View className="bg-white border border-[#E5E7EB] rounded-xl mt-1 p-2">
              <ScrollView
                nestedScrollEnabled
                style={{ maxHeight: FILTER_DROPDOWN_MAX_HEIGHT }}
                showsVerticalScrollIndicator
              >
                {data.availableSubcategories?.map((sub) => {
                  const active = selectedSubcategoryIds.includes(sub.id);
                  return (
                    <TouchableOpacity
                      key={sub.id}
                      onPress={() =>
                        setSelectedSubcategoryIds((current) =>
                          active ? current.filter((item) => item !== sub.id) : [...current, sub.id]
                        )
                      }
                      className="flex-row items-center justify-between px-2 py-2"
                      activeOpacity={0.8}
                    >
                      <Text className={`text-[13px] ${active ? "text-[#111827] font-semibold" : "text-[#4B5563]"}`}>
                        {sub.title} ({sub.productCount})
                      </Text>
                      <Ionicons
                        name={active ? "checkbox" : "square-outline"}
                        size={18}
                        color={active ? "#111827" : "#9CA3AF"}
                      />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}

          {brandDropdownOpen ? (
            <View className="bg-white border border-[#E5E7EB] rounded-xl mt-1 p-2">
              <ScrollView
                nestedScrollEnabled
                style={{ maxHeight: FILTER_DROPDOWN_MAX_HEIGHT }}
                showsVerticalScrollIndicator
              >
                {data.availableBrands?.map((brand) => {
                  const active = selectedBrandIds.includes(brand.id);
                  return (
                    <TouchableOpacity
                      key={brand.id}
                      onPress={() =>
                        setSelectedBrandIds((current) =>
                          active ? current.filter((item) => item !== brand.id) : [...current, brand.id]
                        )
                      }
                      className="flex-row items-center justify-between px-2 py-2"
                      activeOpacity={0.8}
                    >
                      <Text className={`text-[13px] ${active ? "text-[#111827] font-semibold" : "text-[#4B5563]"}`}>
                        {brand.name} ({brand.productCount})
                      </Text>
                      <Ionicons
                        name={active ? "checkbox" : "square-outline"}
                        size={18}
                        color={active ? "#111827" : "#9CA3AF"}
                      />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}
        </View>

        <View className="px-4 mt-2 flex-row gap-2">
          {FILTERS.map((item) => {
            const active = filter === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                onPress={() => setFilter(active ? null : item.key)}
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
        {data.category.productCount > 0 ? data.category.productCount : filteredProducts.length}{" "}
        products found
      </Text>

      {filteredProducts.length === 0 ? (
        <View className="flex-1 justify-center items-center px-8">
          <Text className="text-[#9CA3AF] text-[16px] text-center">
            No products match your filters. Try adjusting your search or price range.
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
          ListFooterComponent={
            hasMore || (data.products.length ?? 0) > CATEGORY_PRODUCTS_PAGE_SIZE ? (
              <View className="py-4 gap-2 items-center">
                {hasMore ? (
                  <TouchableOpacity
                    onPress={loadMore}
                    disabled={loadingMore}
                    className="bg-[#FF5A1F] rounded-xl px-6 py-3 min-w-[160px] items-center"
                    activeOpacity={0.8}
                  >
                    {loadingMore ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text className="text-white text-sm font-semibold">Load more</Text>
                    )}
                  </TouchableOpacity>
                ) : null}
                {(data.products.length ?? 0) > CATEGORY_PRODUCTS_PAGE_SIZE ? (
                  <TouchableOpacity
                    onPress={showLess}
                    className="border border-[#D1D5DB] rounded-xl px-6 py-3 min-w-[160px] items-center"
                    activeOpacity={0.8}
                  >
                    <Text className="text-[#374151] text-sm font-semibold">Show less</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}
