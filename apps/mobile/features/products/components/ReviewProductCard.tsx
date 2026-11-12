import type { OrderLineItem } from "@/features/orders/types/order";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

type ReviewProductCardProps = {
  item: OrderLineItem;
  rating: number;
  feedback: string;
  onRatingChange: (rating: number) => void;
  onFeedbackChange: (text: string) => void;
  onAddPhotos?: () => void;
};

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80";

export default function ReviewProductCard({
  item,
  rating,
  feedback,
  onRatingChange,
  onFeedbackChange,
  onAddPhotos,
}: ReviewProductCardProps) {
  return (
    <View className="bg-white rounded-2xl border border-[#EAEAEA] p-4 mb-4">
      <View className="flex-row gap-3 mb-4">
        <Image
          source={{ uri: item.image ?? PLACEHOLDER_IMAGE }}
          style={{ width: 72, height: 72, borderRadius: 12 }}
          contentFit="cover"
        />
        <View className="flex-1 justify-center">
          <Text className="text-base font-bold text-black" numberOfLines={2}>
            {item.name}
          </Text>
          <Text className="text-[#9CA3AF] text-sm mt-1">Quantity: {item.quantity}</Text>
          <Text className="text-[#FF9800] text-base font-bold mt-1">
            ${item.unitPrice.toFixed(2)}
          </Text>
        </View>
      </View>

      <Text className="text-[#374151] text-sm font-medium mb-2">
        How would you rate this product?
      </Text>
      <View className="flex-row items-center mb-4">
        {Array.from({ length: 5 }).map((_, index) => {
          const starValue = index + 1;
          return (
            <TouchableOpacity
              key={starValue}
              onPress={() => onRatingChange(starValue)}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              activeOpacity={0.8}
            >
              <Ionicons
                name={starValue <= rating ? "star" : "star-outline"}
                size={32}
                color="#FBBF24"
                style={{ marginRight: 4 }}
              />
            </TouchableOpacity>
          );
        })}
        <Text className="text-[#9CA3AF] text-sm ml-2">{rating} stars</Text>
      </View>

      <Text className="text-[#374151] text-sm font-medium mb-2">
        Share your experience (optional)
      </Text>
      <TextInput
        value={feedback}
        onChangeText={onFeedbackChange}
        placeholder="Tell us what you liked or disliked about this product..."
        placeholderTextColor="#9CA3AF"
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-3 text-[15px] text-[#111827] min-h-[100px] mb-4"
      />

      <TouchableOpacity
        onPress={onAddPhotos}
        className="flex-row items-center"
        activeOpacity={0.8}
      >
        <Ionicons name="camera-outline" size={20} color="#FF9800" />
        <Text className="text-[#FF9800] text-sm font-semibold ml-2">Add Photos</Text>
      </TouchableOpacity>
    </View>
  );
}
