import homeJson from "@/data/home.json";
import { apiRequest } from "@/services/api/httpClient";
import { getYouTubeThumbnail } from "@/services/api/recipeVideo";
import type { HomeData } from "@/types/home";

type ApiRecipeItem = {
  id: string;
  title: string;
  slug?: string | null;
  short_description?: string | null;
  thumbnail_url?: string | null;
  youtube_url?: string | null;
  preparation_time?: number | null;
  cooking_time?: number | null;
  servings?: number | null;
  difficulty?: string | null;
  category_name?: string | null;
  tags?: Array<{
    id: string;
    name: string;
    slug: string;
    color?: string;
  }>;
};

type RecipesResponse = {
  success: boolean;
  items: ApiRecipeItem[];
  pagination?: {
    page: number;
    totalPages: number;
  };
};

export type RecipeListItem = {
  id: string;
  slug?: string;
  title: string;
  description: string;
  image: string;
  category: string;
  tags: string[];
  time: string;
  difficulty: string;
  rating: number;
  reviews: number;
  servings: number;
  price: number;
};

type RecipeDetailResponse = {
  success?: boolean;
  item?: {
    id: string;
    slug?: string | null;
    title?: string | null;
    short_description?: string | null;
    content?: string | null;
    thumbnail_url?: string | null;
    youtube_url?: string | null;
    preparation_time?: number | null;
    cooking_time?: number | null;
    servings?: number | null;
    difficulty?: string | null;
    origin?: string | null;
    category_name?: string | null;
    tags?: Array<{ id: string; name: string; slug: string }>;
    instructions?: Array<{
      instruction_id?: string;
      step_number?: number | null;
      step_title?: string | null;
      step_description?: string | null;
      duration_minutes?: number | null;
    }>;
    ingredients?: Array<{
      ingredients_id?: string;
      ingredient_name?: string | null;
      quantity?: number | string | null;
      unit?: string | null;
      product_id?: string | null;
      product_name?: string | null;
      product_base_price?: number | string | null;
      product_image?: string | null;
    }>;
    nutrition?: Array<{
      nutrition_id?: string;
      nutrient_name?: string | null;
      value?: number | string | null;
      unit?: string | null;
      daily_value_percent?: number | string | null;
    }>;
    relatedRecipes?: Array<{
      id: string;
      slug?: string | null;
      title?: string | null;
      thumbnail_url?: string | null;
    }>;
  };
};

export type RecipeInstruction = {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  durationMinutes?: number;
};

export type RecipeIngredient = {
  id: string;
  name: string;
  quantity?: string;
  unit?: string;
  productId?: string;
  productName?: string;
  productImage?: string;
  productPrice?: number;
};

export type RecipeNutrition = {
  id: string;
  name: string;
  value: string;
  unit: string;
  dailyValuePercent?: number;
};

export type RecipeDetailItem = {
  id: string;
  slug?: string;
  title: string;
  description: string;
  content: string;
  instructions: RecipeInstruction[];
  ingredients: RecipeIngredient[];
  nutrition: RecipeNutrition[];
  image: string;
  youtubeUrl?: string;
  category: string;
  cuisine: string;
  diet: string;
  tags: string[];
  time?: string;
  difficulty?: string;
  servings?: number;
  relatedRecipes: Array<{
    id: string;
    slug?: string;
    title: string;
    image: string;
  }>;
};

const recipeByIdCache = new Map<string, ApiRecipeItem>();
const recipeRatingCache = new Map<string, { rating: number; reviews: number }>();

export function clearRecipeRatingCache(recipeId: string) {
  recipeRatingCache.delete(recipeId);
}

type RecipeReviewStatsResponse = {
  total?: number | string;
  average?: number | string;
};

async function fetchRecipeRatingStats(recipeId: string) {
  const cached = recipeRatingCache.get(recipeId);
  if (cached) {
    return cached;
  }

  try {
    const response = await apiRequest<RecipeReviewStatsResponse>(
      `/api/recipes/reviews?recipeId=${encodeURIComponent(recipeId)}&page=1`,
    );
    const total = Number(response.total ?? 0);
    const average = Number(response.average ?? 0);
    const stats = {
      rating: total > 0 && Number.isFinite(average) ? average : 0,
      reviews: Number.isFinite(total) ? total : 0,
    };
    if (stats.reviews > 0) {
      recipeRatingCache.set(recipeId, stats);
    }
    return stats;
  } catch {
    return { rating: 0, reviews: 0 };
  }
}

export async function enrichRecipesWithRatings<
  T extends { id: string; rating: number; reviews: number },
>(recipes: T[]): Promise<T[]> {
  const CHUNK_SIZE = 10;
  const enriched = [...recipes];

  for (let start = 0; start < enriched.length; start += CHUNK_SIZE) {
    const chunk = enriched.slice(start, start + CHUNK_SIZE);
    const statsList = await Promise.all(chunk.map((recipe) => fetchRecipeRatingStats(recipe.id)));

    chunk.forEach((recipe, index) => {
      const stats = statsList[index];
      enriched[start + index] = {
        ...recipe,
        rating: stats.reviews > 0 ? stats.rating : 0,
        reviews: stats.reviews,
      };
    });
  }

  return enriched;
}

function formatRecipeTime(minutes: number) {
  if (minutes <= 0) return "";
  if (minutes < 60) return `${minutes}min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

function mapRecipeMeta(item: {
  preparation_time?: number | null;
  cooking_time?: number | null;
  servings?: number | null;
  difficulty?: string | null;
}) {
  const totalMinutes = (item.preparation_time ?? 0) + (item.cooking_time ?? 0);
  const time = formatRecipeTime(totalMinutes);
  const servings =
    item.servings != null && Number.isFinite(Number(item.servings)) && Number(item.servings) > 0
      ? Number(item.servings)
      : undefined;

  return {
    time: time || undefined,
    difficulty: item.difficulty?.trim() || undefined,
    servings,
  };
}

function mapRecipe(
  item: ApiRecipeItem,
  fallbackRecipe: HomeData["featuredRecipes"][number] | undefined,
  index: number,
): HomeData["featuredRecipes"][number] {
  const totalMinutes = (item.preparation_time ?? 0) + (item.cooking_time ?? 0);

  return {
    id: String(item.id),
    slug: item.slug ?? undefined,
    title: item.title || fallbackRecipe?.title || `Recipe ${index + 1}`,
    description: item.short_description || fallbackRecipe?.description || "",
    image:
      item.thumbnail_url ||
      getYouTubeThumbnail(item.youtube_url) ||
      fallbackRecipe?.image ||
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
    time: formatRecipeTime(totalMinutes),
    difficulty: item.difficulty || fallbackRecipe?.difficulty || "Medium",
    rating: 0,
    reviews: 0,
    servings: item.servings ?? fallbackRecipe?.servings ?? 2,
    price: fallbackRecipe?.price ?? 0,
  };
}

function mapRecipeListItem(
  item: ApiRecipeItem,
  fallbackRecipe: HomeData["featuredRecipes"][number] | undefined,
  index: number,
): RecipeListItem {
  const totalMinutes = (item.preparation_time ?? 0) + (item.cooking_time ?? 0);

  return {
    id: String(item.id),
    slug: item.slug ?? undefined,
    title: item.title || fallbackRecipe?.title || `Recipe ${index + 1}`,
    description: item.short_description || fallbackRecipe?.description || "",
    image:
      item.thumbnail_url ||
      getYouTubeThumbnail(item.youtube_url) ||
      fallbackRecipe?.image ||
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
    category: item.category_name?.trim() || "Recipes",
    tags: (item.tags ?? [])
      .map((tag) => tag?.name?.trim())
      .filter((tag): tag is string => Boolean(tag)),
    time: formatRecipeTime(totalMinutes),
    difficulty: item.difficulty || fallbackRecipe?.difficulty || "Medium",
    rating: 0,
    reviews: 0,
    servings: item.servings ?? fallbackRecipe?.servings ?? 2,
    price: fallbackRecipe?.price ?? 0,
  };
}

export async function getAllRecipesForHomeCards(): Promise<HomeData["featuredRecipes"]> {
  const fallback = (homeJson as HomeData).featuredRecipes;
  const pageSize = 50;
  const maxPages = 20;

  try {
    const allItems: ApiRecipeItem[] = [];

    for (let page = 1; page <= maxPages; page += 1) {
      const response = await apiRequest<RecipesResponse>(`/api/recipes?page=${page}&limit=${pageSize}`);
      const items = response.items ?? [];
      cacheRecipeItems(items);
      allItems.push(...items);

      const totalPages = response.pagination?.totalPages ?? 1;
      if (page >= totalPages || items.length === 0) {
        break;
      }
    }

    if (allItems.length === 0) {
      return fallback;
    }

    return enrichRecipesWithRatings(
      allItems.map((item, index) => mapRecipe(item, fallback[index], index)),
    );
  } catch {
    return fallback;
  }
}

export async function fetchRecipeListPage(page = 1, limit = 20) {
  const response = await apiRequest<RecipesResponse>(`/api/recipes?page=${page}&limit=${limit}`);
  const items = response.items ?? [];
  cacheRecipeItems(items);

  const totalPages = response.pagination?.totalPages ?? 1;

  return {
    recipes: items.map((item, index) => mapRecipeListItem(item, undefined, index)),
    hasMore: page < totalPages && items.length > 0,
  };
}

export async function getAllRecipesForList(): Promise<RecipeListItem[]> {
  const fallback = (homeJson as HomeData).featuredRecipes;
  const pageSize = 50;
  const maxPages = 20;

  try {
    const allItems: ApiRecipeItem[] = [];

    for (let page = 1; page <= maxPages; page += 1) {
      const response = await apiRequest<RecipesResponse>(`/api/recipes?page=${page}&limit=${pageSize}`);
      const items = response.items ?? [];
      cacheRecipeItems(items);
      allItems.push(...items);

      const totalPages = response.pagination?.totalPages ?? 1;
      if (page >= totalPages || items.length === 0) {
        break;
      }
    }

    if (allItems.length === 0) {
      return fallback.map((item, index) => ({
        id: item.id,
      slug: undefined,
        title: item.title,
        description: item.description || "",
        image: item.image,
        category: "Recipes",
        tags: [],
        time: item.time ?? "",
        difficulty: item.difficulty ?? "",
        rating: item.rating,
        reviews: item.reviews,
        servings: item.servings ?? 2,
        price: item.price,
      }));
    }

    return enrichRecipesWithRatings(
      allItems.map((item, index) => mapRecipeListItem(item, fallback[index], index)),
    );
  } catch {
    return fallback.map((item) => ({
      id: item.id,
      slug: undefined,
      title: item.title,
      description: item.description || "",
      image: item.image,
      category: "Recipes",
      tags: [],
      time: item.time ?? "",
      difficulty: item.difficulty ?? "",
      rating: item.rating,
      reviews: item.reviews,
      servings: item.servings ?? 2,
      price: item.price,
    }));
  }
}

function toText(value?: string | null) {
  if (!value) return "";
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function mapInstructions(
  rows?: Array<{
    instruction_id?: string;
    step_number?: number | null;
    step_title?: string | null;
    step_description?: string | null;
    duration_minutes?: number | null;
  }>,
): RecipeInstruction[] {
  return (rows ?? [])
    .map((row) => ({
      id: String(row.instruction_id ?? `${row.step_number ?? 0}`),
      stepNumber: Number(row.step_number) || 0,
      title: row.step_title?.trim() || "",
      description: row.step_description?.trim() || "",
      durationMinutes:
        row.duration_minutes != null && Number(row.duration_minutes) > 0
          ? Number(row.duration_minutes)
          : undefined,
    }))
    .filter((row) => row.description.length > 0 || row.title.length > 0)
    .sort((a, b) => a.stepNumber - b.stepNumber);
}

function mapIngredients(
  rows?: Array<{
    ingredients_id?: string;
    ingredient_name?: string | null;
    quantity?: number | string | null;
    unit?: string | null;
    product_id?: string | null;
    product_name?: string | null;
    product_base_price?: number | string | null;
    product_image?: string | null;
  }>,
): RecipeIngredient[] {
  return (rows ?? [])
    .map((row) => {
      const name = row.ingredient_name?.trim() || "";
      const qty = row.quantity != null ? String(row.quantity).trim() : "";
      const unit = row.unit?.trim() || "";
      const productPrice = Number(row.product_base_price);
      return {
        id: String(row.ingredients_id ?? name),
        name,
        quantity: qty || undefined,
        unit: unit || undefined,
        productId: row.product_id ? String(row.product_id) : undefined,
        productName: row.product_name?.trim() || undefined,
        productImage: row.product_image?.trim() || undefined,
        productPrice: Number.isFinite(productPrice) && productPrice > 0 ? productPrice : undefined,
      };
    })
    .filter((row) => row.name.length > 0);
}

function formatNutritionValue(value?: number | string | null) {
  if (value == null || value === "") return "";
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value).trim();
  return Number.isInteger(num) ? String(num) : String(parseFloat(num.toFixed(2)));
}

function mapNutrition(
  rows?: Array<{
    nutrition_id?: string;
    nutrient_name?: string | null;
    value?: number | string | null;
    unit?: string | null;
    daily_value_percent?: number | string | null;
  }>,
): RecipeNutrition[] {
  return (rows ?? [])
    .map((row) => {
      const dailyValue = Number(row.daily_value_percent);
      return {
        id: String(row.nutrition_id ?? row.nutrient_name ?? ""),
        name: row.nutrient_name?.trim() || "",
        value: formatNutritionValue(row.value),
        unit: row.unit?.trim() || "",
        dailyValuePercent:
          Number.isFinite(dailyValue) && dailyValue > 0 ? dailyValue : undefined,
      };
    })
    .filter((row) => row.name.length > 0 && row.value.length > 0);
}

function cacheRecipeItems(items: ApiRecipeItem[]) {
  items.forEach((item) => {
    if (item.id) {
      recipeByIdCache.set(String(item.id), item);
    }
  });
}

async function findRecipeById(id: string): Promise<ApiRecipeItem | null> {
  const cached = recipeByIdCache.get(id);
  if (cached) return cached;

  const pageSize = 50;
  const maxPages = 20;

  for (let page = 1; page <= maxPages; page += 1) {
    const response = await apiRequest<RecipesResponse>(`/api/recipes?page=${page}&limit=${pageSize}`);
    const items = response.items ?? [];
    cacheRecipeItems(items);
    const match = items.find((item) => String(item.id) === id);
    if (match) return match;
    if (items.length < pageSize) break;
  }

  return null;
}

function mapDetailFromPayload(payload: NonNullable<RecipeDetailResponse["item"]>): RecipeDetailItem {
  const meta = mapRecipeMeta(payload);

  return {
    id: String(payload.id),
    slug: payload.slug ?? undefined,
    title: payload.title?.trim() || "Recipe",
    description: toText(payload.short_description) || payload.short_description?.trim() || "",
    content: toText(payload.content),
    instructions: mapInstructions(payload.instructions),
    ingredients: mapIngredients(payload.ingredients),
    nutrition: mapNutrition(payload.nutrition),
    image:
      payload.thumbnail_url ||
      getYouTubeThumbnail(payload.youtube_url) ||
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
    youtubeUrl: payload.youtube_url ?? undefined,
    category: payload.category_name?.trim() || "Recipes",
    cuisine: payload.origin?.trim() || "Asian Spices",
    diet: payload.category_name?.trim() || "",
    tags: (payload.tags ?? []).map((tag) => tag.name).filter(Boolean),
    ...meta,
    relatedRecipes: (payload.relatedRecipes ?? []).map((item) => ({
      id: String(item.id),
      slug: item.slug ?? undefined,
      title: item.title?.trim() || "Recipe",
      image:
        item.thumbnail_url ||
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
    })),
  };
}

export async function getRecipeDetailById(id: string): Promise<RecipeDetailItem | null> {
  const summary = await findRecipeById(id);
  if (!summary?.slug) {
    return null;
  }

  try {
    const detail = await apiRequest<RecipeDetailResponse>(`/api/recipes/${summary.slug}`);
    if (detail.item) {
      return mapDetailFromPayload(detail.item);
    }
  } catch {
    // Fall back to summary card mapping.
  }

  return {
    id: String(summary.id),
    slug: summary.slug ?? undefined,
    title: summary.title || "Recipe",
    description: toText(summary.short_description) || summary.short_description?.trim() || "",
    content: "",
    instructions: [],
    ingredients: [],
    nutrition: [],
    image:
      summary.thumbnail_url ||
      getYouTubeThumbnail(summary.youtube_url) ||
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
    youtubeUrl: summary.youtube_url ?? undefined,
    category: summary.category_name?.trim() || "Recipes",
    cuisine: "Asian Spices",
    diet: summary.category_name?.trim() || "",
    tags: (summary.tags ?? []).map((tag) => tag.name).filter(Boolean),
    ...mapRecipeMeta(summary),
    relatedRecipes: [],
  };
}

type RecipeFavoritesResponse = {
  success?: boolean;
  recipeIds?: string[];
};

export async function fetchRecipeFavoriteIds(): Promise<string[]> {
  try {
    const response = await apiRequest<RecipeFavoritesResponse>("/api/recipe-favorites");
    return response.recipeIds ?? [];
  } catch {
    return [];
  }
}

export async function addRecipeFavorite(recipeId: string): Promise<void> {
  await apiRequest<{ success?: boolean }>("/api/recipe-favorites", {
    method: "POST",
    body: { recipe_id: recipeId },
  });
}

export async function removeRecipeFavorite(recipeId: string): Promise<void> {
  await apiRequest<{ success?: boolean }>("/api/recipe-favorites", {
    method: "DELETE",
    body: { recipe_id: recipeId },
  });
}

export type RecipeReview = {
  id: string;
  author: string;
  rating: number;
  text: string;
  title?: string;
};

export type RecipeReviewSummary = {
  reviews: RecipeReview[];
  rating: number;
  reviewCount: number;
};

export async function fetchRecipeReviewList(recipeId: string): Promise<RecipeReviewSummary> {
  try {
    const response = await apiRequest<{
      reviews?: Array<{
        id?: string;
        rating?: number | string | null;
        title?: string | null;
        comment?: string | null;
        name?: string | null;
      }>;
      total?: number | string | null;
      average?: number | string | null;
    }>(`/api/recipes/reviews?recipeId=${encodeURIComponent(recipeId)}&page=1&limit=20`);

    const reviews = (response.reviews ?? [])
      .map((item, index) => {
        const text = item.comment?.trim();
        if (!text) return null;

        const rating = Number(item.rating ?? 0);
        return {
          id: String(item.id ?? `review-${index}`),
          author: item.name?.trim() || "Anonymous",
          rating: Number.isFinite(rating) ? Math.max(0, Math.min(5, rating)) : 0,
          text,
          title: item.title?.trim() || undefined,
        };
      })
      .filter((review): review is RecipeReview => review !== null);

    const reviewCount = Number(response.total ?? 0);
    const average = Number(response.average ?? 0);

    return {
      reviews,
      rating: reviewCount > 0 && Number.isFinite(average) ? average : 0,
      reviewCount: Number.isFinite(reviewCount) ? reviewCount : 0,
    };
  } catch {
    return { reviews: [], rating: 0, reviewCount: 0 };
  }
}
