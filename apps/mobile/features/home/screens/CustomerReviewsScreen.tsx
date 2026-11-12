import {
  getAllCustomerReviews,
  type FooterReviewItem,
} from "@/features/products/services/reviewService";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function RatingStars({ rating }: { rating: number }) {
  return (
    <View className="flex-row items-center">
      {Array.from({ length: 5 }).map((_, index) => (
        <Ionicons
          key={index}
          name={index < rating ? "star" : "star-outline"}
          size={14}
          color="#FBBF24"
        />
      ))}
    </View>
  );
}

function ReviewCard({ review }: { review: FooterReviewItem }) {
  return (
    <View className="bg-white rounded-2xl border border-[#E5E7EB] p-4 mb-3">
      <View className="mb-2">
        <RatingStars rating={review.rating} />
      </View>
      <Text className="text-[#334155] text-[15px] leading-6">{review.comment}</Text>
      <View className="flex-row items-center mt-3">
        <View className="w-8 h-8 rounded-full bg-[#FFF7ED] justify-center items-center mr-2">
          <Ionicons name="person" size={16} color="#FF9800" />
        </View>
        <Text className="text-[#0F172A] text-sm font-semibold">{review.guestName}</Text>
      </View>
    </View>
  );
}

export default function CustomerReviewsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [reviews, setReviews] = useState<FooterReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadReviews = useCallback(async () => {
    const data = await getAllCustomerReviews();
    setReviews(data);
  }, []);

  useEffect(() => {
    loadReviews()
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [loadReviews]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadReviews();
    } finally {
      setRefreshing(false);
    }
  };

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
          <Text className="flex-1 text-center text-[18px] font-bold text-black mr-9">
            Customer Reviews
          </Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#FF9800" />
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: insets.bottom + 24,
            flexGrow: 1,
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF9800" />
          }
          ListHeaderComponent={
            <Text className="text-[#6B7280] text-sm mb-4">
              {reviews.length} review{reviews.length === 1 ? "" : "s"}
            </Text>
          }
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center py-20 px-8">
              <Ionicons name="chatbubbles-outline" size={40} color="#D1D5DB" />
              <Text className="text-[#9CA3AF] text-center mt-3">
                No customer reviews available yet.
              </Text>
            </View>
          }
          renderItem={({ item }) => <ReviewCard review={item} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
