import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ComingSoonScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { title } = useLocalSearchParams<{ title?: string }>();
  const displayTitle = typeof title === "string" && title.trim() ? title : "This section";

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <View
        className="border-b border-[#EAEAEA] bg-white"
        style={{ paddingTop: insets.top + 8, paddingBottom: 12 }}
      >
        <View className="flex-row items-center px-4">
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="h-9 w-9 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={26} color="#333333" />
          </TouchableOpacity>
          <Text className="mr-9 flex-1 text-center text-[18px] font-bold text-black">
            Coming Soon
          </Text>
        </View>
      </View>

      <View className="flex-1 justify-center px-4">
        <View className="overflow-hidden rounded-3xl border-2 border-[#FFB74D] bg-white">
          <LinearGradient
            colors={["#FFECB3", "#FFFFFF", "#FFF8E1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingHorizontal: 24, paddingVertical: 40 }}
          >
            <View className="items-center">
              <View className="flex-row items-center gap-2 rounded-full bg-[#FF9800] px-5 py-2.5">
                <Ionicons name="time-outline" size={20} color="#FFFFFF" />
                <Text className="text-sm font-bold uppercase tracking-wider text-white">
                  Launching Soon
                </Text>
              </View>

              <Text className="mt-8 text-center text-[40px] font-black uppercase leading-[44px] text-[#EA580C]">
                Coming{"\n"}Soon
              </Text>

              <Text className="mt-6 text-center text-[20px] font-bold text-[#0F172A]">
                {displayTitle}
              </Text>

              <Text className="mt-4 text-center text-[15px] leading-6 text-[#475569]">
                We are preparing content for this section. Check back soon for more wellness
                insights from Asian Spices.
              </Text>

              <TouchableOpacity
                onPress={() => router.replace("/(tabs)")}
                activeOpacity={0.85}
                className="mt-10 w-full flex-row items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-6 py-3.5"
              >
                <Ionicons name="home-outline" size={18} color="#334155" />
                <Text className="text-[15px] font-medium text-[#334155]">Back to Home</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </View>
  );
}
