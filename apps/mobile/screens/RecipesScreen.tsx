import AppHeader from "@/components/AppHeader";
import { enrichRecipesWithRatings, fetchRecipeListPage, type RecipeListItem } from "@/services/recipeService";
import { Image } from "expo-image";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const PAGE_SIZE = 20;

type PrefetchedPage = {
  page: number;
  recipes: RecipeListItem[];
  hasMore: boolean;
};

function mergeRecipes(current: RecipeListItem[], incoming: RecipeListItem[]) {
  const seen = new Set(current.map((item) => item.id));
  return [...current, ...incoming.filter((item) => !seen.has(item.id))];
}

function RecipeCard({ recipe }: { recipe: RecipeListItem }) {
  const router = useRouter();
  const tagColors = ["#F97316", "#14B8A6", "#EF4444", "#8B5CF6"];

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden mb-3 flex-1"
      onPress={() => router.push({ pathname: "/recipe/[id]", params: { id: recipe.id } })}
    >
      <View className="relative">
        <Image source={{ uri: recipe.image }} style={{ width: "100%", height: 150 }} contentFit="cover" />
        <View className="absolute top-2 left-2 bg-[#FF9800] rounded-full px-2 py-0.5">
          <Text className="text-white text-[10px] font-semibold">{recipe.category}</Text>
        </View>
      </View>
      <View className="px-3 pt-3 pb-3">
        <Text className="text-[16px] font-bold text-[#0B1F44]" numberOfLines={1}>
          {recipe.title}
        </Text>
        <Text className="text-[12px] leading-5 text-[#64748B] mt-1.5" numberOfLines={3}>
          {recipe.description || "Delicious recipe from our kitchen."}
        </Text>
        <View className="flex-row flex-wrap gap-1.5 mt-2.5">
          {(recipe.tags.length > 0 ? recipe.tags : [recipe.category]).slice(0, 3).map((tag, index) => (
            <View
              key={`${recipe.id}-${tag}-${index}`}
              className="rounded-full px-2.5 py-1"
              style={{ backgroundColor: tagColors[index % tagColors.length] }}
            >
              <Text className="text-white text-[10px] font-semibold">#{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function RecipesScreen() {
  const isFocused = useIsFocused();
  const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTag, setSelectedTag] = useState("All");
  const prefetchedPageRef = useRef<PrefetchedPage | null>(null);
  const prefetchingRef = useRef(false);
  const enrichedRecipeIdsRef = useRef<Set<string>>(new Set());
  const enrichingRecipeIdsRef = useRef<Set<string>>(new Set());

  const prefetchNextPage = useCallback(async (nextPage: number) => {
    if (prefetchingRef.current || prefetchedPageRef.current?.page === nextPage) {
      return;
    }

    prefetchingRef.current = true;
    try {
      const result = await fetchRecipeListPage(nextPage, PAGE_SIZE);
      prefetchedPageRef.current = {
        page: nextPage,
        recipes: result.recipes,
        hasMore: result.hasMore,
      };
    } catch (error) {
      console.error(error);
    } finally {
      prefetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    prefetchedPageRef.current = null;
    enrichedRecipeIdsRef.current.clear();
    enrichingRecipeIdsRef.current.clear();

    fetchRecipeListPage(1, PAGE_SIZE)
      .then((result) => {
        setRecipes(result.recipes);
        setHasMore(result.hasMore);
        setPage(1);
        if (result.hasMore) {
          prefetchNextPage(2);
        }
      })
      .catch(() => setRecipes([]))
      .finally(() => setLoading(false));
  }, [prefetchNextPage]);

  useEffect(() => {
    if (!isFocused || loading || recipes.length === 0) return;

    const recipesToEnrich = recipes.filter(
      (recipe) =>
        !enrichedRecipeIdsRef.current.has(recipe.id) &&
        !enrichingRecipeIdsRef.current.has(recipe.id),
    );
    if (recipesToEnrich.length === 0) return;

    recipesToEnrich.forEach((recipe) => {
      enrichingRecipeIdsRef.current.add(recipe.id);
    });

    let cancelled = false;

    enrichRecipesWithRatings(recipesToEnrich)
      .then((enrichedRecipes) => {
        if (cancelled) return;

        enrichedRecipes.forEach((recipe) => {
          enrichedRecipeIdsRef.current.add(recipe.id);
        });

        const enrichedById = new Map(enrichedRecipes.map((recipe) => [recipe.id, recipe]));

        setRecipes((current) =>
          current.map((recipe) => enrichedById.get(recipe.id) ?? recipe),
        );
      })
      .catch(console.error)
      .finally(() => {
        recipesToEnrich.forEach((recipe) => {
          enrichingRecipeIdsRef.current.delete(recipe.id);
        });
      });

    return () => {
      cancelled = true;
      recipesToEnrich.forEach((recipe) => {
        enrichingRecipeIdsRef.current.delete(recipe.id);
      });
    };
  }, [isFocused, loading, recipes]);

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;

    const nextPage = page + 1;
    const prefetched = prefetchedPageRef.current;

    if (prefetched?.page === nextPage) {
      setRecipes((current) => mergeRecipes(current, prefetched.recipes));
      setPage(nextPage);
      setHasMore(prefetched.hasMore);
      prefetchedPageRef.current = null;

      if (prefetched.hasMore) {
        prefetchNextPage(nextPage + 1);
      }
      return;
    }

    setLoadingMore(true);
    try {
      const result = await fetchRecipeListPage(nextPage, PAGE_SIZE);
      setRecipes((current) => mergeRecipes(current, result.recipes));
      setPage(nextPage);
      setHasMore(result.hasMore);

      if (result.hasMore) {
        prefetchNextPage(nextPage + 1);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMore(false);
    }
  };

  const categories = useMemo(() => {
    const unique = Array.from(new Set(recipes.map((recipe) => recipe.category).filter(Boolean)));
    return ["All", ...unique];
  }, [recipes]);

  const popularTags = useMemo(() => {
    const tagCounts = new Map<string, number>();
    recipes.forEach((recipe) => {
      recipe.tags.forEach((tag) => {
        const key = tag.trim();
        if (!key) return;
        tagCounts.set(key, (tagCounts.get(key) ?? 0) + 1);
      });
    });

    const sorted = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag]) => tag);

    return ["All", ...sorted];
  }, [recipes]);

  const filteredRecipes = useMemo(() => {
    const query = search.trim().toLowerCase();

    return recipes.filter((recipe) => {
      const matchesCategory = selectedCategory === "All" || recipe.category === selectedCategory;
      if (!matchesCategory) return false;
      const matchesTag = selectedTag === "All" || recipe.tags.includes(selectedTag);
      if (!matchesTag) return false;
      if (!query) return true;

      const inTitle = recipe.title.toLowerCase().includes(query);
      const inDescription = recipe.description.toLowerCase().includes(query);
      const inTags = recipe.tags.some((tag) => tag.toLowerCase().includes(query));
      return inTitle || inDescription || inTags;
    });
  }, [recipes, search, selectedCategory, selectedTag]);

  const rows = useMemo(() => {
    const list: RecipeListItem[][] = [];
    for (let i = 0; i < filteredRecipes.length; i += 2) {
      list.push(filteredRecipes.slice(i, i + 2));
    }
    return list;
  }, [filteredRecipes]);

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <AppHeader searchPlaceholder="Search recipes..." />
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#FF9800" />
        </View>
      ) : (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-4 py-4">
            <Text className="text-[20px] font-bold text-black">All Recipes</Text>
            <Text className="text-[13px] text-[#9CA3AF] mt-1">
              Browse all recipes
            </Text>
          </View>
          <View className="px-4 mb-3">
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search recipes..."
              placeholderTextColor="#9CA3AF"
              className="bg-white border border-[#E5E7EB] rounded-xl px-4 h-[44px] text-[14px] text-black"
            />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="px-4 pb-3"
          >
            {categories.map((category) => {
              const active = selectedCategory === category;
              return (
                <TouchableOpacity
                  key={category}
                  onPress={() => setSelectedCategory(category)}
                  activeOpacity={0.8}
                  className={`rounded-full px-4 py-2 mr-2 border ${
                    active ? "bg-[#FF9800] border-[#FF9800]" : "bg-white border-[#E5E7EB]"
                  }`}
                >
                  <Text className={`text-[12px] font-semibold ${active ? "text-white" : "text-[#374151]"}`}>
                    {category}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View className="px-4 mb-2">
            <Text className="text-[12px] font-semibold text-[#6B7280]">Popular Tags</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="px-4 pb-3"
          >
            {popularTags.map((tag) => {
              const active = selectedTag === tag;
              return (
                <TouchableOpacity
                  key={tag}
                  onPress={() => setSelectedTag(tag)}
                  activeOpacity={0.8}
                  className={`rounded-full px-4 py-2 mr-2 border ${
                    active ? "bg-[#0EA5E9] border-[#0EA5E9]" : "bg-white border-[#E5E7EB]"
                  }`}
                >
                  <Text className={`text-[12px] font-semibold ${active ? "text-white" : "text-[#374151]"}`}>
                    {tag === "All" ? "All" : `#${tag}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View className="px-4">
            {rows.map((row, rowIndex) => (
              <View key={rowIndex} className="flex-row gap-3">
                {row.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
                {row.length === 1 ? <View className="flex-1" /> : null}
              </View>
            ))}
            {filteredRecipes.length === 0 ? (
              <Text className="text-[#9CA3AF] text-center py-8">No recipes found.</Text>
            ) : null}
            {hasMore ? (
              <TouchableOpacity
                onPress={loadMore}
                disabled={loadingMore}
                className="mt-2 mb-2 rounded-xl border border-[#FF9800] py-3 items-center"
                activeOpacity={0.85}
              >
                {loadingMore ? (
                  <ActivityIndicator size="small" color="#FF9800" />
                ) : (
                  <Text className="text-[#FF9800] text-sm font-semibold">Load More</Text>
                )}
              </TouchableOpacity>
            ) : null}
          </View>
          <View className="h-6" />
        </ScrollView>
      )}
    </View>
  );
}
