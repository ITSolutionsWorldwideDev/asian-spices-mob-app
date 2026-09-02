import type { CategoryItem } from "@/types/category";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "3":
    "We're preparing an exciting collection of premium kitchen appliances designed to make cooking easier, faster, and more enjoyable.",
  "2":
    "We're curating authentic Asian foods and beverages — snacks, sauces, drinks, and pantry staples — for you to discover soon.",
  "1":
    "We're handpicking the finest whole spices, blends, and seasoning mixes to bring authentic Asian flavors to your kitchen.",
};

const CATEGORY_HIGHLIGHTS: Record<string, string[]> = {
  "3": ["Smart Cookware", "Modern Appliances", "Premium Quality"],
  "2": ["Pantry Staples", "Authentic Flavors", "Fresh Selection"],
  "1": ["Premium Spices", "Traditional Blends", "Authentic Taste"],
};

type ComingSoonCategoryProps = {
  category: CategoryItem;
  subcategoryTitle?: string;
};

export default function ComingSoonCategory({
  category,
  subcategoryTitle,
}: ComingSoonCategoryProps) {
  const router = useRouter();

  const title = subcategoryTitle ?? category.title;
  const description =
    CATEGORY_DESCRIPTIONS[category.id] ??
    `We're preparing an exciting collection for ${category.title.toLowerCase()}. Stay tuned for authentic quality products from Asian Spices.`;
  const highlights =
    CATEGORY_HIGHLIGHTS[category.id] ??
    category.description
      .split(/,|\band\b/)
      .map((part) => part.trim())
      .filter(Boolean)
      .slice(0, 3)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1));

  const displayHighlights =
    highlights.length >= 3
      ? highlights.slice(0, 3)
      : ["Premium Quality", "Authentic Selection", "Launching Soon"];

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-4 pb-8 pt-2"
      showsVerticalScrollIndicator={false}
    >
      <View className="overflow-hidden rounded-3xl border-2 border-[#FFB74D] bg-white shadow-lg">
        <LinearGradient
          colors={["#FFECB3", "#FFFFFF", "#FFF8E1"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingHorizontal: 20, paddingVertical: 32 }}
        >
          <View className="items-center">
            <View className="flex-row items-center gap-2 rounded-full bg-[#FF9800] px-5 py-2.5 shadow-md">
              <Ionicons name="time-outline" size={20} color="#FFFFFF" />
              <Text className="text-sm font-bold uppercase tracking-wider text-white">
                Launching Soon
              </Text>
            </View>

            <Text className="mt-8 text-center text-[44px] font-black uppercase leading-[48px] tracking-tight text-[#EA580C]">
              Coming{"\n"}Soon
            </Text>

            <Text className="mt-6 text-center text-[22px] font-bold text-[#0F172A]">
              {title}
            </Text>

            <Text className="mt-4 text-center text-[15px] font-medium leading-7 text-[#475569]">
              {description}
            </Text>

            {category.emoji ? (
              <Text className="mt-3 text-4xl">{category.emoji}</Text>
            ) : null}

            <View className="mt-8 w-full gap-3">
              {displayHighlights.map((highlight) => (
                <View
                  key={highlight}
                  className="rounded-2xl bg-white px-5 py-4 shadow-sm"
                >
                  <Text className="text-center text-[15px] font-semibold text-[#1E293B]">
                    {highlight}
                  </Text>
                </View>
              ))}
            </View>

            <View className="mt-10 w-full gap-3">
              <TouchableOpacity
                onPress={() => router.replace("/(tabs)")}
                activeOpacity={0.85}
                className="flex-row items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-6 py-3.5"
              >
                <Ionicons name="arrow-back" size={18} color="#334155" />
                <Text className="text-[15px] font-medium text-[#334155]">Back to Home</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/signup")}
                activeOpacity={0.85}
                className="rounded-xl px-6 py-3.5"
              >
                <LinearGradient
                  colors={["#FF9800", "#F59E0B"]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={{
                    borderRadius: 12,
                    paddingVertical: 14,
                    alignItems: "center",
                  }}
                >
                  <Text className="text-[15px] font-semibold text-white">
                    Notify Me When Available
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>
    </ScrollView>
  );
}
