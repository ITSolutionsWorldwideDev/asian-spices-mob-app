import {
  addRecipeFavorite,
  clearRecipeRatingCache,
  fetchRecipeFavoriteIds,
  fetchRecipeReviewList,
  getRecipeDetailById,
  removeRecipeFavorite,
  type RecipeIngredient,
  type RecipeReviewSummary,
} from "@/features/recipes/services/recipeService";
import { getStoredAuthUser } from "@/features/auth/services/authService";
import { submitRecipeReview } from "@/features/products/services/reviewService";
import { useCart } from "@/features/cart/contexts/CartContext";
import { getProductById } from "@/features/products/services/productService";
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

const tagColors = ["#F97316", "#14B8A6", "#EF4444", "#8B5CF6"];

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
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={20} color="#6B7280" />
      </TouchableOpacity>
      {open ? (
        <View className="px-4 py-3 border-t border-[#E5E7EB] bg-white">{children}</View>
      ) : null}
    </View>
  );
}

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addItem } = useCart();
  const [loading, setLoading] = useState(true);
  const [recipe, setRecipe] = useState<Awaited<ReturnType<typeof getRecipeDetailById>>>(null);
  const [reviewSummary, setReviewSummary] = useState<RecipeReviewSummary>({
    reviews: [],
    rating: 0,
    reviewCount: 0,
  });
  const [isFavorite, setIsFavorite] = useState(false);
  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  const [reviewName, setReviewName] = useState("");
  const [reviewEmail, setReviewEmail] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [openSections, setOpenSections] = useState({
    about: true,
    ingredients: false,
    nutrition: false,
    instructions: false,
    reviews: false,
    writeReview: false,
  });

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const loadReviews = useCallback(async (recipeId: string) => {
    const summary = await fetchRecipeReviewList(recipeId);
    setReviewSummary(summary);
  }, []);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    getRecipeDetailById(id)
      .then(setRecipe)
      .catch(() => setRecipe(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;

    loadReviews(id).catch(() =>
      setReviewSummary({ reviews: [], rating: 0, reviewCount: 0 }),
    );
  }, [id, loadReviews]);

  useEffect(() => {
    getStoredAuthUser()
      .then((user) => {
        if (user?.name) setReviewName(user.name);
        if (user?.email) setReviewEmail(user.email);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!id) return;

    fetchRecipeFavoriteIds()
      .then((ids) => setIsFavorite(ids.includes(id)))
      .catch(() => setIsFavorite(false));
  }, [id]);

  const handleToggleFavorite = useCallback(async () => {
    if (!id) return;

    const authUser = await getStoredAuthUser().catch(() => null);
    if (!authUser) {
      Alert.alert("Login required", "Please log in to save favorite recipes.", [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: () => router.push("/login") },
      ]);
      return;
    }

    const wasFavorite = isFavorite;
    setIsFavorite(!wasFavorite);

    try {
      if (wasFavorite) {
        await removeRecipeFavorite(id);
      } else {
        await addRecipeFavorite(id);
      }
    } catch (error) {
      setIsFavorite(wasFavorite);
      Alert.alert(
        "Favorite",
        error instanceof Error ? error.message : "Could not update favorite recipe.",
      );
    }
  }, [id, isFavorite, router]);

  const handleAddIngredientToCart = useCallback(
    async (ingredient: RecipeIngredient) => {
      if (!ingredient.productId || addingProductId) return;

      setAddingProductId(ingredient.productId);
      try {
        const product = await getProductById(ingredient.productId);
        if (product) {
          addItem(product, 1);
          Alert.alert("Added to cart", `${product.name} was added to your cart.`);
          return;
        }

        if (ingredient.productName) {
          addItem(
            {
              id: ingredient.productId,
              name: ingredient.productName,
              image:
                ingredient.productImage ??
                "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80",
              rating: 0,
              reviewCount: 0,
              price: ingredient.productPrice ?? 0,
              brand: "",
              weight: "",
              description: "",
              inStock: true,
              reviews: [],
            },
            1,
          );
          Alert.alert("Added to cart", `${ingredient.productName} was added to your cart.`);
          return;
        }

        Alert.alert("Unavailable", "This product could not be loaded.");
      } catch {
        Alert.alert("Error", "Could not add this ingredient to cart.");
      } finally {
        setAddingProductId(null);
      }
    },
    [addItem, addingProductId],
  );

  const handleSubmitReview = useCallback(async () => {
    if (!id) return;

    const name = reviewName.trim();
    const email = reviewEmail.trim();
    const comment = reviewComment.trim();

    if (!name || !email || !comment) {
      Alert.alert("Missing details", "Please enter your name, email, and review.");
      return;
    }

    setSubmittingReview(true);
    try {
      await submitRecipeReview({
        recipeId: id,
        name,
        email,
        rating: reviewRating,
        comment,
      });
      setReviewComment("");
      clearRecipeRatingCache(id);
      await loadReviews(id);
      setOpenSections((prev) => ({
        ...prev,
        writeReview: false,
        reviews: true,
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
  }, [id, reviewComment, reviewEmail, reviewName, reviewRating, loadReviews]);

  if (loading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#FF9800" />
      </View>
    );
  }

  if (!recipe) {
    return (
      <View className="flex-1 bg-white justify-center items-center px-8">
        <Text className="text-[#9CA3AF] text-center mb-4">Recipe not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-[#FF9800] font-medium">Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
            Recipe Details
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="mx-4 mt-4 rounded-2xl overflow-hidden">
          <Image source={{ uri: recipe.image }} style={{ width: "100%", height: 280 }} contentFit="cover" />
          <View className="absolute top-3 left-3 bg-[#FF9800] rounded-full px-2.5 py-1">
            <Text className="text-white text-xs font-semibold">{recipe.category}</Text>
          </View>
          <TouchableOpacity
            onPress={handleToggleFavorite}
            className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 justify-center items-center"
            activeOpacity={0.8}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={22}
              color={isFavorite ? "#EF4444" : "#6B7280"}
            />
          </TouchableOpacity>
        </View>

        <View className="px-4 mt-4 pb-8">
          <Text className="text-[24px] font-bold text-[#0B1F44]">{recipe.title}</Text>
          {recipe.description ? (
            <Text className="text-[#64748B] text-sm mt-2 leading-6">{recipe.description}</Text>
          ) : null}

          <View className="flex-row mt-4">
            <View className="flex-1">
              <Text className="text-[#0B1F44] text-xs font-bold">Cuisine</Text>
              <Text className="text-[#0B1F44] text-base mt-1">{recipe.cuisine}</Text>
            </View>
            {recipe.diet ? (
              <View className="flex-1">
                <Text className="text-[#0B1F44] text-xs font-bold">Diet</Text>
                <Text className="text-[#0B1F44] text-base mt-1">{recipe.diet}</Text>
              </View>
            ) : null}
          </View>

          <View className="flex-row flex-wrap gap-2 mt-3">
            {recipe.time ? (
              <View className="bg-white rounded-full px-3 py-1 border border-[#E5E7EB]">
                <Text className="text-[#374151] text-xs font-semibold">{recipe.time}</Text>
              </View>
            ) : null}
            {recipe.difficulty ? (
              <View className="bg-white rounded-full px-3 py-1 border border-[#E5E7EB]">
                <Text className="text-[#374151] text-xs font-semibold">{recipe.difficulty}</Text>
              </View>
            ) : null}
            {recipe.servings ? (
              <View className="bg-white rounded-full px-3 py-1 border border-[#E5E7EB]">
                <Text className="text-[#374151] text-xs font-semibold">
                  {recipe.servings} servings
                </Text>
              </View>
            ) : null}
          </View>

          {recipe.tags.length > 0 ? (
            <View className="flex-row flex-wrap gap-2 mt-4">
              {recipe.tags.map((tag, index) => (
                <View
                  key={`${tag}-${index}`}
                  className="rounded-full px-3 py-1"
                  style={{ backgroundColor: tagColors[index % tagColors.length] }}
                >
                  <Text className="text-white text-xs font-semibold">#{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <AccordionSection
            title="About the Recipe"
            icon="document-text-outline"
            open={openSections.about}
            onToggle={() => toggleSection("about")}
          >
            {recipe.content ? (
              <Text className="text-[#475569] text-sm leading-6">{recipe.content}</Text>
            ) : (
              <Text className="text-[#9CA3AF] text-sm">No description available.</Text>
            )}
          </AccordionSection>

          {recipe.ingredients.length > 0 ? (
            <AccordionSection
              title="Ingredients"
              icon="leaf-outline"
              open={openSections.ingredients}
              onToggle={() => toggleSection("ingredients")}
            >
              {recipe.ingredients.map((ingredient, index) => (
                <View
                  key={ingredient.id}
                  className={`flex-row items-center rounded-xl border border-[#E5E7EB] p-3 ${
                    index === 0 ? "" : "mt-2"
                  }`}
                >
                  {ingredient.productImage ? (
                    <Image
                      source={{ uri: ingredient.productImage }}
                      style={{ width: 48, height: 48, borderRadius: 8 }}
                      contentFit="cover"
                    />
                  ) : (
                    <View className="w-12 h-12 rounded-lg bg-[#FFF7ED] justify-center items-center">
                      <Ionicons name="leaf-outline" size={20} color="#FF9800" />
                    </View>
                  )}
                  <View className="flex-1 ml-3">
                    {ingredient.quantity || ingredient.unit ? (
                      <Text className="text-[#6B7280] text-xs">
                        {[ingredient.quantity, ingredient.unit].filter(Boolean).join(" ")}
                      </Text>
                    ) : null}
                    <Text className="text-black text-sm font-semibold mt-0.5" numberOfLines={2}>
                      {ingredient.productName ?? ingredient.name}
                    </Text>
                  </View>
                  {ingredient.productId ? (
                    <TouchableOpacity
                      onPress={() => handleAddIngredientToCart(ingredient)}
                      disabled={addingProductId === ingredient.productId}
                      className={`rounded-lg px-3 py-2 ${
                        addingProductId === ingredient.productId ? "bg-[#D1D5DB]" : "bg-[#FF9800]"
                      }`}
                      activeOpacity={0.85}
                    >
                      {addingProductId === ingredient.productId ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text className="text-white text-xs font-semibold">Add</Text>
                      )}
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))}
            </AccordionSection>
          ) : null}

          {recipe.nutrition.length > 0 ? (
            <AccordionSection
              title="Nutrition"
              icon="fitness-outline"
              open={openSections.nutrition}
              onToggle={() => toggleSection("nutrition")}
            >
              <View className="rounded-xl border border-[#E5E7EB] overflow-hidden">
                {recipe.nutrition.map((item, index) => (
                  <View
                    key={item.id}
                    className={`flex-row items-center justify-between px-3 py-3 ${
                      index < recipe.nutrition.length - 1 ? "border-b border-[#E5E7EB]" : ""
                    }`}
                  >
                    <Text className="text-[#374151] text-sm flex-1">{item.name}</Text>
                    <View className="items-end ml-3">
                      <Text className="text-black text-sm font-semibold">
                        {item.value}
                        {item.unit ? ` ${item.unit}` : ""}
                      </Text>
                      {item.dailyValuePercent ? (
                        <Text className="text-[#6B7280] text-xs mt-0.5">
                          {item.dailyValuePercent}% DV
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            </AccordionSection>
          ) : null}

          {recipe.instructions.length > 0 ? (
            <AccordionSection
              title="Instructions"
              icon="list-outline"
              open={openSections.instructions}
              onToggle={() => toggleSection("instructions")}
            >
              {recipe.instructions.map((step, index) => (
                <View
                  key={step.id}
                  className={`rounded-xl border border-[#E5E7EB] p-3 ${index === 0 ? "" : "mt-2"}`}
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[#FF9800] text-xs font-bold">Step {step.stepNumber}</Text>
                    {step.durationMinutes ? (
                      <Text className="text-[#6B7280] text-xs">{step.durationMinutes} min</Text>
                    ) : null}
                  </View>
                  {step.title ? (
                    <Text className="text-black text-sm font-semibold mt-1">{step.title}</Text>
                  ) : null}
                  <Text className="text-[#475569] text-sm mt-1 leading-6">{step.description}</Text>
                </View>
              ))}
            </AccordionSection>
          ) : null}

          {reviewSummary.reviews.length > 0 ? (
            <AccordionSection
              title={`Reviews (${reviewSummary.reviewCount})`}
              icon="chatbubbles-outline"
              open={openSections.reviews}
              onToggle={() => toggleSection("reviews")}
            >
              <View className="flex-row items-center mb-3">
                <StarRow rating={reviewSummary.rating} />
                <Text className="text-[#6B7280] text-sm ml-2">
                  {reviewSummary.rating.toFixed(1)} ({reviewSummary.reviewCount} reviews)
                </Text>
              </View>
              {reviewSummary.reviews.map((review, index) => (
                <View
                  key={review.id}
                  className={`rounded-xl border border-[#E5E7EB] p-3 ${index === 0 ? "" : "mt-2"}`}
                >
                  <View className="flex-row items-center">
                    <Text className="text-black text-sm font-semibold">{review.author}</Text>
                    <View className="ml-2">
                      <StarRow rating={review.rating} size={12} />
                    </View>
                  </View>
                  {review.title ? (
                    <Text className="text-black text-sm font-medium mt-1">{review.title}</Text>
                  ) : null}
                  <Text className="text-[#6B7280] text-sm mt-1 leading-5">{review.text}</Text>
                </View>
              ))}
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
              className={`mt-3 rounded-xl py-3 items-center ${
                submittingReview ? "bg-[#D1D5DB]" : "bg-[#FF9800]"
              }`}
              activeOpacity={0.85}
            >
              {submittingReview ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-white text-sm font-semibold">Submit Review</Text>
              )}
            </TouchableOpacity>
          </AccordionSection>

          {recipe.relatedRecipes.length > 0 ? (
            <>
              <Text className="text-black text-base font-bold mt-6 mb-3">Related Recipes</Text>
              {recipe.relatedRecipes.slice(0, 4).map((related) => (
                <TouchableOpacity
                  key={related.id}
                  onPress={() => router.push({ pathname: "/recipe/[id]", params: { id: related.id } })}
                  activeOpacity={0.85}
                  className="flex-row bg-white rounded-xl border border-[#E5E7EB] mb-2 overflow-hidden"
                >
                  <Image source={{ uri: related.image }} style={{ width: 84, height: 64 }} contentFit="cover" />
                  <View className="flex-1 px-3 justify-center">
                    <Text className="text-[13px] font-semibold text-black" numberOfLines={2}>
                      {related.title}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
