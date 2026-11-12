import AppHeader from "@/shared/components/AppHeader";
import CategoryGrid from "@/features/home/components/CategoryGrid";
import FooterReviewsSection from "@/features/home/components/FooterReviewsSection";
import HeroBanner from "@/features/home/components/HeroBanner";
import LazyHomeSection from "@/features/home/components/LazyHomeSection";
import ProductGridSection from "@/features/home/components/ProductGridSection";
import RecipeGridSection from "@/features/home/components/RecipeGridSection";
import ReelsRow from "@/features/home/components/ReelsRow";
import SectionHeader from "@/features/home/components/SectionHeader";
import { enrichProductsWithRatings } from "@/features/categories/services/categoryService";
import {
  getHomeCategories,
  getHomeFeaturedRecipes,
  getHomeHero,
  getHomeNewArrivals,
  getHomeReels,
  getHomeSpecialDiscounts,
  getHomeTopProducts,
} from "@/features/home/services/homeService";
import { enrichRecipesWithRatings } from "@/features/recipes/services/recipeService";
import { getFooterReviews, type FooterReviewItem } from "@/features/products/services/reviewService";
import type { Category, Product, Recipe, Reel } from "@/features/home/types/home";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

function useHomeSection<T>(
  loader: () => Promise<T>,
  initial: T,
  enricher?: (data: T) => Promise<T>,
) {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const startedRef = useRef(false);

  const load = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    setLoading(true);
    loader()
      .then((result) => {
        setData(result);
        setLoaded(true);
        setLoading(false);
      })
      .catch(console.error)
      .finally(() => {
        setLoading(false);
        setLoaded(true);
      });
  }, [loader]);

  const enrich = useCallback(() => {
    if (!enricher || !Array.isArray(data) || data.length === 0) {
      return Promise.resolve();
    }

    return enricher(data)
      .then((enriched) => {
        if (Array.isArray(enriched) && enriched.length > 0) {
          setData(enriched);
        }
      })
      .catch(console.error);
  }, [data, enricher]);

  return { data, loading, loaded, load, enrich };
}

export default function HomeScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const hero = getHomeHero();
  const ratingsEnrichedRef = useRef(false);
  const ratingsEnrichmentStartedRef = useRef(false);
  const recipeRatingsEnrichedRef = useRef(false);
  const recipeRatingsEnrichmentStartedRef = useRef(false);
  const [scrollY, setScrollY] = useState(0);
  const [viewportHeight] = useState(() => Dimensions.get("window").height);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const reelsSection = useHomeSection<Reel[]>(getHomeReels, []);
  const topProductsSection = useHomeSection<Product[]>(
    getHomeTopProducts,
    [],
    enrichProductsWithRatings,
  );
  const newArrivalsSection = useHomeSection<Product[]>(
    getHomeNewArrivals,
    [],
    enrichProductsWithRatings,
  );
  const featuredRecipesSection = useHomeSection<Recipe[]>(
    getHomeFeaturedRecipes,
    [],
    enrichRecipesWithRatings,
  );
  const specialDiscountsSection = useHomeSection<Product[]>(
    getHomeSpecialDiscounts,
    [],
    enrichProductsWithRatings,
  );
  const footerReviewsSection = useHomeSection<FooterReviewItem[]>(getFooterReviews, []);

  const topProductsRef = useRef(topProductsSection);
  topProductsRef.current = topProductsSection;
  const newArrivalsRef = useRef(newArrivalsSection);
  newArrivalsRef.current = newArrivalsSection;
  const specialDiscountsRef = useRef(specialDiscountsSection);
  specialDiscountsRef.current = specialDiscountsSection;
  const featuredRecipesRef = useRef(featuredRecipesSection);
  featuredRecipesRef.current = featuredRecipesSection;

  useEffect(() => {
    getHomeCategories()
      .then(setCategories)
      .catch(console.error)
      .finally(() => setCategoriesLoading(false));

    topProductsSection.load();
    newArrivalsSection.load();
    specialDiscountsSection.load();
  }, []);

  useEffect(() => {
    if (!isFocused) return;

    const productSectionsReady =
      topProductsSection.loaded &&
      newArrivalsSection.loaded &&
      specialDiscountsSection.loaded;

    if (!productSectionsReady || ratingsEnrichedRef.current || ratingsEnrichmentStartedRef.current) {
      return;
    }

    ratingsEnrichmentStartedRef.current = true;
    let cancelled = false;

    Promise.all([
      topProductsRef.current.enrich(),
      newArrivalsRef.current.enrich(),
      specialDiscountsRef.current.enrich(),
    ])
      .then(() => {
        if (!cancelled) {
          ratingsEnrichedRef.current = true;
        }
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) {
          ratingsEnrichmentStartedRef.current = false;
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    isFocused,
    topProductsSection.loaded,
    newArrivalsSection.loaded,
    specialDiscountsSection.loaded,
  ]);

  useEffect(() => {
    if (!isFocused) return;
    if (!featuredRecipesSection.loaded) return;
    if (recipeRatingsEnrichedRef.current || recipeRatingsEnrichmentStartedRef.current) {
      return;
    }

    recipeRatingsEnrichmentStartedRef.current = true;
    let cancelled = false;

    featuredRecipesRef.current
      .enrich()
      .then(() => {
        if (!cancelled) {
          recipeRatingsEnrichedRef.current = true;
        }
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) {
          recipeRatingsEnrichmentStartedRef.current = false;
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isFocused, featuredRecipesSection.loaded]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrollY(event.nativeEvent.contentOffset.y);
  };

  const handleCategoryPress = (category: Category) => {
    router.push({
      pathname: "/categories/[id]/[subId]",
      params: { id: category.routeId ?? category.id, subId: "all" },
    });
  };

  const openReels = (reelId?: string) => {
    router.push({
      pathname: "/(tabs)/reels",
      params: reelId ? { reelId } : {},
    });
  };

  const handleReelPress = (reel: Reel) => {
    openReels(reel.id);
  };

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <AppHeader searchPlaceholder="Search spices, recipes.." />

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        scrollEventThrottle={16}
        onScroll={handleScroll}
      >
        <HeroBanner
          hero={hero}
          onPromoPress={() => router.push("/special-discounts")}
        />

        <View className="py-4">
          <SectionHeader
            title="Categories"
            actionLabel="See All"
            onActionPress={() => router.push("/categories")}
          />
          {categoriesLoading ? (
            <View className="py-8 items-center">
              <ActivityIndicator size="small" color="#FF9800" />
            </View>
          ) : (
            <CategoryGrid
              categories={categories.slice(0, 8)}
              onCategoryPress={handleCategoryPress}
            />
          )}
        </View>

        <LazyHomeSection
          scrollY={scrollY}
          viewportHeight={viewportHeight}
          onLoad={reelsSection.load}
          loading={reelsSection.loading}
          loaded={reelsSection.loaded}
          minHeight={180}
        >
          <View className="bg-[#FFF5F5] py-4 mb-2">
            <View className="flex-row items-center justify-between px-4 mb-3">
              <View>
                <Text className="text-[17px] font-bold text-black">Trending Recipe Reels</Text>
                <Text className="text-[13px] text-[#9CA3AF] mt-0.5">Watch & Cook</Text>
              </View>
              <TouchableOpacity
                onPress={() => openReels()}
                className="w-9 h-9 rounded-full bg-[#FF9800] justify-center items-center"
              >
                <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <ReelsRow reels={reelsSection.data} onReelPress={handleReelPress} />
          </View>
        </LazyHomeSection>

        <ProductGridSection
          title="Top Products"
          actionLabel="See More"
          onActionPress={() => router.push("/top-products")}
          products={topProductsSection.data}
        />

        <ProductGridSection
          title="New Arrivals"
          subtitle="Latest herbal wellness products"
          actionLabel="See More"
          onActionPress={() => router.push("/new-arrivals")}
          products={newArrivalsSection.data}
          backgroundColor="#F0FAF4"
          icon="sparkles-outline"
          iconBg="#DCFCE7"
        />

        <LazyHomeSection
          scrollY={scrollY}
          viewportHeight={viewportHeight}
          onLoad={featuredRecipesSection.load}
          loading={featuredRecipesSection.loading}
          loaded={featuredRecipesSection.loaded}
          minHeight={200}
        >
          <RecipeGridSection
            title="Featured Recipes"
            subtitle="Try these delicious dishes"
            recipes={featuredRecipesSection.data}
            onSeeAllPress={() => router.push("/recipes")}
          />
        </LazyHomeSection>

        <ProductGridSection
          title="Special Discounts"
          subtitle="Limited time offers"
          actionLabel="See More"
          onActionPress={() => router.push("/special-discounts")}
          products={specialDiscountsSection.data}
          backgroundColor="#FFF5F5"
          showOriginalPrice
        />

        <LazyHomeSection
          scrollY={scrollY}
          viewportHeight={viewportHeight}
          onLoad={footerReviewsSection.load}
          loading={footerReviewsSection.loading}
          loaded={footerReviewsSection.loaded}
          minHeight={160}
        >
          <FooterReviewsSection reviews={footerReviewsSection.data} />
        </LazyHomeSection>

        <View className="h-6" />
      </ScrollView>
    </View>
  );
}
