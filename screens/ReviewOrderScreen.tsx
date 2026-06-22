import AppHeader from "@/components/AppHeader";
import AppTabBar from "@/components/AppTabBar";
import ReviewProductCard from "@/components/ReviewProductCard";
import { getOrderById } from "@/services/orderService";
import { getProductById } from "@/services/productService";
import type { Order } from "@/types/order";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type ReviewState = Record<string, { rating: number; feedback: string }>;

export default function ReviewOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<ReviewState>({});

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    getOrderById(id)
      .then(async (data) => {
        if (!data) {
          setOrder(null);
          return;
        }

        const itemsWithImages = await Promise.all(
          data.items.map(async (item) => {
            if (item.image) return item;
            const product = await getProductById(item.productId);
            return { ...item, image: product?.image };
          })
        );

        setOrder({ ...data, items: itemsWithImages });
        setReviews(
          Object.fromEntries(
            itemsWithImages.map((item) => [
              item.productId,
              { rating: 5, feedback: "" },
            ])
          )
        );
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const updateReview = (
    productId: string,
    patch: Partial<{ rating: number; feedback: string }>
  ) => {
    setReviews((current) => ({
      ...current,
      [productId]: { ...current[productId], ...patch },
    }));
  };

  const handleAddPhotos = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow access to your photos to add images.");
      return;
    }
    await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
  };

  const handleSubmit = () => {
    const unrated = order?.items.some((item) => !reviews[item.productId]?.rating);
    if (unrated) {
      Alert.alert("Rating required", "Please rate all products before submitting.");
      return;
    }
    Alert.alert("Thank you!", "Your review has been submitted successfully.");
    router.back();
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#F5F5F5]">
        <AppHeader searchPlaceholder="Search spices, recipes..." />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#FF9800" />
        </View>
        <AppTabBar />
      </View>
    );
  }

  if (!order) {
    return (
      <View className="flex-1 bg-[#F5F5F5]">
        <AppHeader searchPlaceholder="Search spices, recipes..." />
        <View className="flex-1 justify-center items-center px-8">
          <Text className="text-[#9CA3AF] text-center mb-4">Order not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-[#FF9800] font-medium">Go back</Text>
          </TouchableOpacity>
        </View>
        <AppTabBar />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      <AppHeader searchPlaceholder="Search spices, recipes..." />

      <View className="bg-white border-b border-[#EAEAEA] py-3">
        <View className="flex-row items-center px-4">
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-9 h-9 justify-center items-center"
          >
            <Ionicons name="chevron-back" size={26} color="#333333" />
          </TouchableOpacity>
          <Text className="flex-1 text-center text-[18px] font-bold text-black mr-9">
            Review Order
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 16,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="bg-[#EFF6FF] rounded-xl px-4 py-3 mb-4">
            <Text className="text-[#1E40AF] text-sm leading-5">
              Order #{order.orderNumber} • Your feedback helps others make better choices!
            </Text>
          </View>

          {order.items.map((item) => (
            <ReviewProductCard
              key={item.productId}
              item={item}
              rating={reviews[item.productId]?.rating ?? 5}
              feedback={reviews[item.productId]?.feedback ?? ""}
              onRatingChange={(rating) => updateReview(item.productId, { rating })}
              onFeedbackChange={(feedback) => updateReview(item.productId, { feedback })}
              onAddPhotos={handleAddPhotos}
            />
          ))}

          <TouchableOpacity
            onPress={handleSubmit}
            className="bg-[#FF9800] rounded-xl py-4 items-center mt-2"
            activeOpacity={0.85}
          >
            <Text className="text-white text-base font-semibold">Submit Review</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      <AppTabBar />
    </View>
  );
}
