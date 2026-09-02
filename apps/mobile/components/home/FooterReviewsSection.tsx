import type { FooterReviewItem } from "@/services/reviewService";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import SectionHeader from "./SectionHeader";

type FooterReviewsSectionProps = {
  reviews: FooterReviewItem[];
};

function RatingStars({ rating }: { rating: number }) {
  return (
    <View className="flex-row items-center">
      {Array.from({ length: 5 }).map((_, index) => (
        <Ionicons
          key={index}
          name={index < rating ? "star" : "star-outline"}
          size={12}
          color="#FBBF24"
        />
      ))}
    </View>
  );
}

export default function FooterReviewsSection({ reviews }: FooterReviewsSectionProps) {
  const router = useRouter();

  return (
    <View className="py-4 bg-white mt-2">
      <SectionHeader
        title="Customer Reviews"
        subtitle="What customers are saying"
        actionLabel="See All"
        onActionPress={() => router.push("/customer-reviews")}
      />
      {reviews.length === 0 ? (
        <View className="px-4">
          <Text className="text-[#9CA3AF] text-sm">No reviews available right now.</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-4 pb-1"
        >
          {reviews.map((review) => (
            <View
              key={review.id}
              className="w-[260px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-3 mr-3"
            >
              <RatingStars rating={review.rating} />
              <Text className="text-[#475569] text-sm mt-2 leading-5" numberOfLines={4}>
                {review.comment}
              </Text>
              <Text className="text-[#0F172A] text-xs font-semibold mt-2">{review.guestName}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
