import AppTabBar from "@/components/AppTabBar";
import QualityBannerCard from "@/components/healthyLiving/QualityBannerCard";
import SupplementCategoryCard from "@/components/healthyLiving/SupplementCategoryCard";
import { getHerbalSkinProductsData } from "@/services/herbalSkinProductsService";
import type { HealthyLivingCatalogData } from "@/types/healthyLivingCatalog";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HerbalSkinProductsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<HealthyLivingCatalogData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHerbalSkinProductsData()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#FF9800" />
      </View>
    );
  }

  const { theme } = data;

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
        <Text className="text-white text-[24px] font-bold leading-8">{data.title}</Text>
        <Text className="text-white/90 text-[14px] mt-1">{data.subtitle}</Text>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-6"
      >
        <View
          className="px-5 py-5"
          style={{ backgroundColor: theme.introBackgroundColor }}
        >
          <Text className="text-[14px] text-[#4B5563] leading-6">{data.introDescription}</Text>
        </View>

        <View className="px-4 pt-4">
          <Text className="text-[18px] font-bold text-black mb-3">
            {data.categoriesSectionTitle}
          </Text>

          {data.categories.map((category) => (
            <SupplementCategoryCard
              key={category.id}
              category={category}
              showProductCount={false}
              onPress={() =>
                router.push({
                  pathname: "/coming-soon",
                  params: { title: category.title },
                })
              }
            />
          ))}

          <QualityBannerCard
            banner={data.qualityBanner}
            backgroundColor={theme.qualityBannerBackground}
          />
        </View>
      </ScrollView>

      <AppTabBar activeTab="home" />
    </View>
  );
}
