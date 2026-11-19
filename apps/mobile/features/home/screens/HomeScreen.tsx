import CategoryGrid from "@/features/home/components/CategoryGrid";
import FooterReviewsSection from "@/features/home/components/FooterReviewsSection";
import HeroBanner from "@/features/home/components/HeroBanner";
import LazyHomeSection from "@/features/home/components/LazyHomeSection";
import ProductGridSection from "@/features/home/components/ProductGridSection";
import RecipeGridSection from "@/features/home/components/RecipeGridSection";
import ReelsRow from "@/features/home/components/ReelsRow";
import SectionHeader from "@/features/home/components/SectionHeader";
import homeJson from "@/features/home/data/home.json";
import {
  getHomeCategories,
  getHomeFeaturedRecipes,
  getHomeHero,
  getHomeNewArrivals,
  getHomeReels,
  getHomeSpecialDiscounts,
  getHomeTopProducts,
} from "@/features/home/services/homeService";
import type { Category, HomeData, Product, Recipe, Reel } from "@/features/home/types/home";
import { getFooterReviews, type FooterReviewItem } from "@/features/products/services/reviewService";
import { enrichRecipesWithRatings } from "@/features/recipes/services/recipeService";
import AppHeader from "@/shared/components/AppHeader";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  View,
} from "react-native";

const fallbackHome = homeJson as HomeData;
const SECTION_LOAD_TIMEOUT_MS = 8000;

function useHomeSection<T>(
  loader: () => Promise<T>,
  initial: T,
  enricher?: (data: T) => Promise<T>,
  autoLoad = false,
) {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(autoLoad && !(Array.isArray(initial) && initial.length > 0));
  const [loaded, setLoaded] = useState(false);
  const startedRef = useRef(false);
  const dataRef = useRef(data);
  const loaderRef = useRef(loader);
  const enricherRef = useRef(enricher);
  dataRef.current = data;
  loaderRef.current = loader;
  enricherRef.current = enricher;

  const load = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    setLoading(true);

    let settled = false;
    const finish = (result?: T) => {
      if (settled) return;
      settled = true;
      if (result !== undefined) {
        setData((prev) => {
          if (Array.isArray(result)) {
            if (result.length > 0) return result;
            if (Array.isArray(prev) && prev.length > 0) return prev;
            return result;
          }
          return (result ?? prev) as T;
        });
      }
      setLoading(false);
      setLoaded(true);
    };

    const timeoutId = setTimeout(() => {
      // Keep whatever is already on screen (fallback/cache) if API hangs.
      finish();
    }, SECTION_LOAD_TIMEOUT_MS);

    loaderRef
      .current()
      .then((result) => {
        clearTimeout(timeoutId);
        finish(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        console.error(error);
        finish();
      });
  }, []);

  useEffect(() => {
    if (autoLoad) {
      load();
    }
  }, [autoLoad, load]);

  const enrich = useCallback(() => {
    const enricherFn = enricherRef.current;
    const current = dataRef.current;
    if (!enricherFn || !Array.isArray(current) || current.length === 0) {
      return Promise.resolve();
    }

    return enricherFn(current)
      .then((enriched) => {
        if (!Array.isArray(enriched) || enriched.length === 0) return;
        setData(enriched as T);
      })
      .catch(console.error);
  }, []);

  return { data, loading, loaded, load, enrich };
}

export default function HomeScreen() {
  const router = useRouter();
  const hero = getHomeHero();
  const recipeRatingsEnrichedRef = useRef(false);
  const recipeRatingsEnrichmentStartedRef = useRef(false);
  const [scrollY, setScrollY] = useState(0);
  const [viewportHeight] = useState(() => Dimensions.get("window").height);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const reelsSection = useHomeSection<Reel[]>(getHomeReels, []);
  // Seed with local fallback so sections never render as blank lines while API loads.
  const topProductsSection = useHomeSection<Product[]>(
    getHomeTopProducts,
    fallbackHome.topProducts,
    undefined,
    true,
  );
  const newArrivalsSection = useHomeSection<Product[]>(
    getHomeNewArrivals,
    fallbackHome.newArrivals,
    undefined,
    true,
  );
  const featuredRecipesSection = useHomeSection<Recipe[]>(
    getHomeFeaturedRecipes,
    [],
    enrichRecipesWithRatings,
  );
  const specialDiscountsSection = useHomeSection<Product[]>(
    getHomeSpecialDiscounts,
    fallbackHome.specialDiscounts,
    undefined,
    true,
  );
  const footerReviewsSection = useHomeSection<FooterReviewItem[]>(getFooterReviews, []);

  const featuredRecipesRef = useRef(featuredRecipesSection);
  featuredRecipesRef.current = featuredRecipesSection;

  useEffect(() => {
    getHomeCategories()
      .then(setCategories)
      .catch(console.error)
      .finally(() => setCategoriesLoading(false));
  }, []);

  useEffect(() => {
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
  }, [featuredRecipesSection.loaded]);

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
            <SectionHeader
              title="Trending Recipe Reels"
              subtitle="Watch & Cook"
              actionLabel="See More"
              onActionPress={() => openReels()}
            />
            <ReelsRow reels={reelsSection.data} onReelPress={handleReelPress} />
          </View>
        </LazyHomeSection>

        <ProductGridSection
          title="Top Products"
          actionLabel="See More"
          onActionPress={() => router.push("/top-products")}
          products={topProductsSection.data}
          loading={topProductsSection.loading}
        />

        <ProductGridSection
          title="New Arrivals"
          subtitle="Latest herbal wellness products"
          actionLabel="See More"
          onActionPress={() => router.push("/new-arrivals")}
          products={newArrivalsSection.data}
          loading={newArrivalsSection.loading}
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
          loading={specialDiscountsSection.loading}
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
