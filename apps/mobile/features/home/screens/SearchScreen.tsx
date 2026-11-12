import ProductListCard from "@/features/categories/components/ProductListCard";
import type { RecipeListItem } from "@/features/recipes/services/recipeService";
import { searchCatalog } from "@/features/home/services/searchService";
import type { CategoryProduct } from "@/features/categories/types/category";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Keyboard,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function RecipeResultCard({ recipe }: { recipe: RecipeListItem }) {
  const router = useRouter();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push({ pathname: "/recipe/[id]", params: { id: recipe.id } })}
      className="mb-3 flex-row overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white"
    >
      <Image source={{ uri: recipe.image }} style={{ width: 96, height: 96 }} contentFit="cover" />
      <View className="flex-1 px-3 py-2.5">
        <Text className="text-[15px] font-semibold text-black" numberOfLines={1}>
          {recipe.title}
        </Text>
        <Text className="mt-1 text-[12px] leading-5 text-[#64748B]" numberOfLines={2}>
          {recipe.description || "Recipe from Asian Spices"}
        </Text>
        <Text className="mt-1 text-[11px] font-medium text-[#FF9800]">{recipe.category}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function SearchScreen() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<CategoryProduct[]>([]);
  const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setProducts([]);
      setRecipes([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      searchCatalog(trimmed)
        .then((results) => {
          setProducts(results.products);
          setRecipes(results.recipes);
          setSearched(true);
        })
        .catch(() => {
          setProducts([]);
          setRecipes([]);
          setSearched(true);
        })
        .finally(() => setLoading(false));
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const hasResults = products.length > 0 || recipes.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-[#F5F5F5]" edges={["top"]}>
      <View className="border-b border-[#E5E7EB] bg-white px-4 py-3">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>

          <View className="h-[44px] flex-1 flex-row items-center rounded-full border border-[#E5E7EB] bg-[#F9FAFB] px-3">
            <Ionicons name="search" size={18} color="#9CA3AF" />
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              placeholder="Search spices, recipes..."
              placeholderTextColor="#9CA3AF"
              returnKeyType="search"
              autoCorrect={false}
              className="ml-2 flex-1 text-[15px] text-black"
              onSubmitEditing={() => Keyboard.dismiss()}
            />
            {query.length > 0 ? (
              <TouchableOpacity onPress={() => setQuery("")} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF9800" />
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-4 pt-4"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {!query.trim() ? (
            <View className="items-center px-6 py-16">
              <Ionicons name="search-outline" size={48} color="#D1D5DB" />
              <Text className="mt-4 text-center text-base text-[#9CA3AF]">
                Search for spices, products, and recipes
              </Text>
            </View>
          ) : null}

          {searched && !hasResults ? (
            <Text className="py-10 text-center text-[#9CA3AF]">{`No results found for "${query.trim()}"`}</Text>
          ) : null}

          {products.length > 0 ? (
            <View className="mb-6">
              <Text className="mb-3 text-[16px] font-bold text-black">
                Products ({products.length})
              </Text>
              <View className="flex-row flex-wrap gap-3">
                {products.map((product) => (
                  <View key={product.id} className="w-[48%]">
                    <ProductListCard
                      product={product}
                      onPress={() =>
                        router.push({ pathname: "/product/[id]", params: { id: product.id } })
                      }
                    />
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {recipes.length > 0 ? (
            <View className="mb-6">
              <Text className="mb-3 text-[16px] font-bold text-black">
                Recipes ({recipes.length})
              </Text>
              {recipes.map((recipe) => (
                <RecipeResultCard key={recipe.id} recipe={recipe} />
              ))}
            </View>
          ) : null}

          <View className="h-8" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
