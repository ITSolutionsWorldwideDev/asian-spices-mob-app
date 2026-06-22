import AppHeader from "@/components/AppHeader";
import CategoryGrid from "@/components/home/CategoryGrid";
import HeroBanner from "@/components/home/HeroBanner";
import ProductGridSection from "@/components/home/ProductGridSection";
import RecipeGridSection from "@/components/home/RecipeGridSection";
import ReelsRow from "@/components/home/ReelsRow";
import SectionHeader from "@/components/home/SectionHeader";
import { getHomeData } from "@/services/homeService";
import type { Category, HomeData, Reel } from "@/types/home";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function HomeScreen() {
  const router = useRouter();
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHomeData()
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
          Failed to load home data.
        </Text>
      </View>
    );
  }

  const handleCategoryPress = (category: Category) => {
    router.push({
      pathname: "/categories/[id]",
      params: { id: category.routeId ?? category.id },
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

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <HeroBanner hero={data.hero} />

        <View className="py-4">
          <SectionHeader
            title="Categories"
            actionLabel="See All"
            onActionPress={() => router.push("/categories")}
          />
          <CategoryGrid
            categories={data.categories}
            onCategoryPress={handleCategoryPress}
          />
        </View>

        <View className="bg-[#FFF5F5] py-4 mb-2">
          <View className="flex-row items-center justify-between px-4 mb-3">
            <View>
              <Text className="text-[17px] font-bold text-black">
                Trending Recipe Reels
              </Text>
              <Text className="text-[13px] text-[#9CA3AF] mt-0.5">
                Watch & Cook
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => openReels()}
              className="w-9 h-9 rounded-full bg-[#FF9800] justify-center items-center"
            >
              <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <ReelsRow reels={data.reels} onReelPress={handleReelPress} />
        </View>

        <ProductGridSection
          title="Top Products"
          actionLabel="See More"
          products={data.topProducts}
        />

        <ProductGridSection
          title="New Arrivals"
          subtitle="Latest herbal wellness products"
          products={data.newArrivals}
          backgroundColor="#F0FAF4"
          icon="sparkles-outline"
          iconBg="#DCFCE7"
        />

        <ProductGridSection
          title="Herbal Products"
          subtitle="Natural wellness essentials"
          products={data.herbalProducts}
          icon="leaf-outline"
          iconBg="#DCFCE7"
        />

        <ProductGridSection
          title="Kitchen Appliances"
          subtitle="Essential cooking tools"
          products={data.kitchenAppliances}
          showBrand
        />

        <RecipeGridSection
          title="Featured Recipes"
          subtitle="Try these delicious dishes"
          recipes={data.featuredRecipes}
        />

        <ProductGridSection
          title="Special Discounts"
          subtitle="Limited time offers"
          actionLabel="See More"
          products={data.specialDiscounts}
          backgroundColor="#FFF5F5"
        />

        <View className="h-6" />
      </ScrollView>
    </View>
  );
}
