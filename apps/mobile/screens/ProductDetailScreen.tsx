import SellerInfoModal from "@/components/SellerInfoModal";
import SuccessPopup from "@/components/SuccessPopup";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { toWishlistItem, useWishlist } from "@/contexts/WishlistContext";
import { getStoredAuthUser } from "@/services/api/authService";
import { clearProductRatingCache } from "@/services/categoryService";
import { getProductById } from "@/services/productService";
import { submitProductReview } from "@/services/reviewService";
import { fetchProductSeller } from "@/services/sellerService";
import type { ProductDetail } from "@/types/product";
import type { ProductSeller } from "@/types/seller";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <View className="flex-row items-center">
      {Array.from({ length: 5 }).map((_, index) => (
        <Ionicons
          key={index}
          name={index < Math.round(rating) ? "star" : "star-outline"}
          size={size}
          color="#FBBF24"
        />
      ))}
    </View>
  );
}

function StarPicker({
  rating,
  onChange,
}: {
  rating: number;
  onChange: (value: number) => void;
}) {
  return (
    <View className="flex-row items-center">
      {Array.from({ length: 5 }).map((_, index) => {
        const value = index + 1;
        return (
          <TouchableOpacity
            key={value}
            onPress={() => onChange(value)}
            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
          >
            <Ionicons
              name={value <= rating ? "star" : "star-outline"}
              size={28}
              color="#FBBF24"
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function AccordionSection({
  title,
  icon,
  open,
  onToggle,
  children,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <View className="mt-3 rounded-2xl border border-[#E5E7EB] overflow-hidden">
      <TouchableOpacity
        onPress={onToggle}
        className="flex-row items-center justify-between bg-[#FAFAFA] px-4 py-3.5"
        activeOpacity={0.85}
      >
        <View className="flex-row items-center flex-1">
          <View className="w-8 h-8 rounded-full bg-[#FFF3E0] items-center justify-center mr-3">
            <Ionicons name={icon} size={16} color="#FF9800" />
          </View>
          <Text className="text-black text-base font-bold flex-1">{title}</Text>
        </View>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={20}
          color="#6B7280"
        />
      </TouchableOpacity>
      {open ? (
        <View className="px-4 py-3 border-t border-[#E5E7EB] bg-white">{children}</View>
      ) : null}
    </View>
  );
}

export default function ProductDetailScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addItem } = useCart();
  const { formatPrice } = useCurrency();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [showAddedPopup, setShowAddedPopup] = useState(false);
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [seller, setSeller] = useState<ProductSeller | null>(null);
  const [sellerLoading, setSellerLoading] = useState(false);
  const [sellerError, setSellerError] = useState<string | null>(null);
  const [reviewName, setReviewName] = useState("");
  const [reviewEmail, setReviewEmail] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [openSections, setOpenSections] = useState({
    description: true,
    healthBenefits: false,
    writeReview: false,
    customerReviews: false,
  });

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const loadProduct = useCallback(async (productId: string) => {
    const data = await getProductById(productId);
    setProduct(data);
    return data;
  }, []);

  const handleViewSeller = useCallback(async () => {
    if (!product) return;

    setShowSellerModal(true);
    setSellerLoading(true);
    setSellerError(null);
    setSeller(null);

    const result = await fetchProductSeller(product.id);
    setSellerLoading(false);

    if (!result) {
      setSellerError("Seller information is not available for this product.");
      return;
    }

    setSeller(result);
  }, [product]);

  const handleAddToCart = () => {
    addItem(product!, quantity);
    setShowAddedPopup(true);
  };

  const handleBuyNow = () => {
    if (!product) return;
    addItem(product, quantity);
    router.push("/cart");
  };

  const handleDismissPopup = useCallback(() => {
    setShowAddedPopup(false);
  }, []);

  const handlePopupOk = useCallback(() => {
    setShowAddedPopup(false);
    router.back();
  }, [router]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    loadProduct(id)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, loadProduct]);

  useEffect(() => {
    getStoredAuthUser()
      .then((user) => {
        if (user?.name) setReviewName(user.name);
        if (user?.email) setReviewEmail(user.email);
      })
      .catch(() => undefined);
  }, []);

  const handleSubmitReview = async () => {
    if (!product) return;

    const name = reviewName.trim();
    const email = reviewEmail.trim();
    const comment = reviewComment.trim();

    if (!name || !email || !comment) {
      Alert.alert("Missing details", "Please enter your name, email, and review.");
      return;
    }

    setSubmittingReview(true);
    try {
      await submitProductReview({
        productId: product.id,
        name,
        email,
        rating: reviewRating,
        comment,
      });
      setReviewComment("");
      clearProductRatingCache(product.id);
      await loadProduct(product.id);
      setOpenSections((prev) => ({
        ...prev,
        writeReview: false,
        customerReviews: true,
      }));
      Alert.alert("Thank you", "Your review was submitted.");
    } catch (error) {
      Alert.alert(
        "Could not submit review",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#FF9800" />
      </View>
    );
  }

  if (!product) {
    return (
      <View className="flex-1 bg-white justify-center items-center px-8">
        <Text className="text-[#9CA3AF] text-center mb-4">
          Product not found
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-[#FF9800] font-medium">Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
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
            Product Details
          </Text>
          <TouchableOpacity
            onPress={() => product && toggleWishlist(toWishlistItem(product))}
            className="absolute right-4 w-9 h-9 justify-center items-center"
            activeOpacity={0.8}
          >
            <Ionicons
              name={isWishlisted(product.id) ? "heart" : "heart-outline"}
              size={22}
              color={isWishlisted(product.id) ? "#EF4444" : "#333333"}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="relative mx-4 mt-4 rounded-2xl overflow-hidden bg-white border border-[#EAEAEA] p-3 items-center justify-center">
          <Image
            source={{ uri: product.image }}
            style={{ width: "100%", height: 320 }}
            contentFit="contain"
          />
          {product.category ? (
            <View className="absolute top-3 left-3 bg-white/95 rounded-lg px-2.5 py-1.5">
              <Text className="text-[#374151] text-xs font-semibold">
                {product.category}
              </Text>
            </View>
          ) : null}
          {product.discountType === "fixed" && product.discount ? (
            <View className="absolute top-3 right-3 bg-[#FF3B30] rounded-lg px-2.5 py-1">
              <Text className="text-white text-xs font-bold">
                -{formatPrice(product.discount)}
              </Text>
            </View>
          ) : product.discountPercent ? (
            <View className="absolute top-3 right-3 bg-[#FF3B30] rounded-lg px-2.5 py-1">
              <Text className="text-white text-xs font-bold">
                -{product.discountPercent}% OFF
              </Text>
            </View>
          ) : null}
          {product.origin ? (
            <View className="absolute bottom-3 right-3 bg-white/95 rounded-lg px-2.5 py-1.5">
              <Text className="text-[#374151] text-xs font-semibold">
                Origin: {product.origin}
              </Text>
            </View>
          ) : null}
        </View>

        <View className="px-4 mt-4">
          <View className="flex-row items-start justify-between gap-2">
            <Text className="flex-1 text-[22px] font-bold text-black leading-7">
              {product.name}
            </Text>
            {product.inStock ? (
              <View className="bg-[#22C55E] rounded-full px-2.5 py-1">
                <Text className="text-white text-[11px] font-semibold">
                  In Stock
                </Text>
              </View>
            ) : null}
          </View>

          <Text className="text-[#9CA3AF] text-sm mt-1">{product.weight}</Text>
          <Text className="text-[#FF9800] text-sm mt-1 font-medium">
            Brand: {product.brand}
          </Text>

          <TouchableOpacity
            onPress={handleViewSeller}
            className="mt-3 self-start flex-row items-center border border-[#FF9800] rounded-lg px-3 py-2"
            activeOpacity={0.85}
          >
            <Ionicons name="storefront-outline" size={16} color="#FF9800" />
            <Text className="text-[#FF9800] text-sm font-semibold ml-2">
              View Seller
            </Text>
          </TouchableOpacity>

          {product.reviewCount > 0 ? (
            <View className="flex-row items-center mt-2">
              <StarRow rating={product.rating} />
              <Text className="text-[#6B7280] text-sm ml-2">
                {product.rating.toFixed(1)} ({product.reviewCount} reviews)
              </Text>
            </View>
          ) : null}

          <View className="flex-row items-center mt-2">
            <Text className="text-[#FF9800] text-[28px] font-bold">
              {formatPrice(product.price)}
            </Text>
            {product.originalPrice ? (
              <Text className="text-[#9CA3AF] text-base line-through ml-2">
                {formatPrice(product.originalPrice)}
              </Text>
            ) : null}
          </View>

          <Text className="text-black text-base font-bold mt-5">Quantity</Text>
          <View className="flex-row items-center mt-3">
            <TouchableOpacity
              onPress={() => setQuantity((value) => Math.max(1, value - 1))}
              className="w-9 h-9 rounded-full border border-[#E5E7EB] justify-center items-center"
              activeOpacity={0.8}
            >
              <Ionicons name="remove" size={18} color="#333333" />
            </TouchableOpacity>
            <Text className="mx-5 text-lg font-semibold text-black">
              {quantity}
            </Text>
            <TouchableOpacity
              onPress={() => setQuantity((value) => value + 1)}
              className="w-9 h-9 rounded-full border border-[#E5E7EB] justify-center items-center"
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={18} color="#333333" />
            </TouchableOpacity>
          </View>

          <AccordionSection
            title="Description"
            icon="document-text-outline"
            open={openSections.description}
            onToggle={() => toggleSection("description")}
          >
            <Text className="text-[#6B7280] text-sm leading-5">
              {product.description}
            </Text>
          </AccordionSection>

          {product.healthBenefits ? (
            <AccordionSection
              title="Health Benefits"
              icon="leaf-outline"
              open={openSections.healthBenefits}
              onToggle={() => toggleSection("healthBenefits")}
            >
              <Text className="text-[#6B7280] text-sm leading-5">
                {product.healthBenefits}
              </Text>
            </AccordionSection>
          ) : null}

          <AccordionSection
            title="Write a Review"
            icon="create-outline"
            open={openSections.writeReview}
            onToggle={() => toggleSection("writeReview")}
          >
            <StarPicker rating={reviewRating} onChange={setReviewRating} />
            <TextInput
              value={reviewName}
              onChangeText={setReviewName}
              placeholder="Your name"
              placeholderTextColor="#9CA3AF"
              className="mt-3 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-2.5 text-sm text-black"
            />
            <TextInput
              value={reviewEmail}
              onChangeText={setReviewEmail}
              placeholder="Your email"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              className="mt-2 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-2.5 text-sm text-black"
            />
            <TextInput
              value={reviewComment}
              onChangeText={setReviewComment}
              placeholder="Write your review..."
              placeholderTextColor="#9CA3AF"
              multiline
              textAlignVertical="top"
              className="mt-2 min-h-[90px] rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-2.5 text-sm text-black"
            />
            <TouchableOpacity
              onPress={handleSubmitReview}
              disabled={submittingReview}
              className="mt-3 rounded-xl bg-[#FF9800] py-3 items-center"
              activeOpacity={0.85}
            >
              {submittingReview ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-white text-sm font-semibold">Submit Review</Text>
              )}
            </TouchableOpacity>
          </AccordionSection>

          <AccordionSection
            title={`Customer Reviews${product.reviewCount > 0 ? ` (${product.reviewCount})` : ""}`}
            icon="chatbubbles-outline"
            open={openSections.customerReviews}
            onToggle={() => toggleSection("customerReviews")}
          >
            {product.reviews.length === 0 ? (
              <Text className="text-[#9CA3AF] text-sm">No reviews yet.</Text>
            ) : (
              product.reviews.map((review, index) => (
                <View key={review.id} className={index === 0 ? "" : "mt-3"}>
                  <View className="flex-row items-center">
                    <Text className="text-black text-sm font-semibold">
                      {review.author}
                    </Text>
                    <View className="ml-2">
                      <StarRow rating={review.rating} size={12} />
                    </View>
                  </View>
                  <Text className="text-[#6B7280] text-sm mt-1 leading-5">
                    {review.text}
                  </Text>
                </View>
              ))
            )}
          </AccordionSection>
        </View>
      </ScrollView>

      <View
        className="bg-white border-t border-[#EAEAEA] px-4 pt-3 flex-row gap-3"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <TouchableOpacity
          onPress={handleAddToCart}
          className="flex-1 bg-[#FF9800] rounded-xl py-3.5 flex-row justify-center items-center"
          activeOpacity={0.85}
        >
          <Ionicons name="cart-outline" size={20} color="#FFFFFF" />
          <Text className="text-white text-base font-semibold ml-2">
            Add to Cart
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleBuyNow}
          className="flex-1 bg-[#1F2937] rounded-xl py-3.5 justify-center items-center"
          activeOpacity={0.85}
        >
          <Text className="text-white text-base font-semibold">Buy Now</Text>
        </TouchableOpacity>
      </View>

      <SuccessPopup
        visible={showAddedPopup}
        message="Added to cart successfully"
        onClose={handleDismissPopup}
        onOk={handlePopupOk}
      />

      <SellerInfoModal
        visible={showSellerModal}
        seller={seller}
        loading={sellerLoading}
        error={sellerError}
        onClose={() => setShowSellerModal(false)}
      />
    </View>
  );
}
