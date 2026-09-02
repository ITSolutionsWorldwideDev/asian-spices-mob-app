import homeJson from "@/data/home.json";
import { API_BASE } from "@/services/api/apiBase";
import { apiRequest } from "@/services/api/httpClient";
import { setProductMetaFromApiRow } from "@/services/api/productMetaCache";
import {
    extractYouTubeVideoId,
    formatCompactCount,
    formatVideoClock,
    getYouTubeStatsMap,
    getYouTubeThumbnail,
} from "@/services/api/recipeVideo";
import { enrichProductsWithRatings } from "@/services/categoryService";
import { resolveProductPricing } from "@/services/productPricing";
import { enrichRecipesWithRatings } from "@/services/recipeService";
import { ensureTaxRulesLoaded } from "@/services/taxService";
import type { HomeData } from "@/types/home";

const PRODUCT_IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80";

function resolveProductImage(image?: string | null) {
  const trimmed = image?.trim();
  if (!trimmed) return PRODUCT_IMAGE_FALLBACK;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${API_BASE}${path}`;
}

type ApiCategoryItem = {
  id: string;
  name: string;
  slug: string;
};

type CategoriesResponse = {
  categories?: ApiCategoryItem[];
};

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
};

type RecipesResponse = {
  success: boolean;
  items: ApiRecipeItem[];
};

type ApiProductItem = {
  id: string;
  category_id?: string | null;
  name?: string | null;
  image?: string | null;
  description?: string | null;
  base_price?: string | number | null;
  sale_price?: string | number | null;
  discount_type?: string | null;
  discount_value?: string | number | null;
  brand_id?: string | null;
  quantity?: number | null;
  rank?: number | null;
};

type ProductsResponse = {
  data?: ApiProductItem[];
};

const apiSpecialDiscountCache = new Map<string, ApiProductItem>();

export function getCachedApiSpecialDiscountProduct(id: string): ApiProductItem | null {
  return apiSpecialDiscountCache.get(id) ?? null;
}

function formatReelDuration(minutes?: number | null) {
  if (!minutes || minutes <= 0) return "";
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs <= 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

function formatRecipeCardTime(minutes?: number | null) {
  if (!minutes || minutes <= 0) return "";
  if (minutes < 60) return `${minutes}min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

function mapRecipeToHomeReel(
  recipe: ApiRecipeItem,
  index: number,
  stats?: { likes: number; views: number; durationSeconds?: number },
): HomeData["reels"][number] {
  const totalMinutes = (recipe.preparation_time ?? 0) + (recipe.cooking_time ?? 0);
  const videoDuration = formatVideoClock(stats?.durationSeconds ?? 0);

  return {
    id: String(recipe.id),
    title: recipe.title || `Recipe ${index + 1}`,
    chefName: recipe.category_name || "Asian Spices",
    chefAvatar: `https://i.pravatar.cc/100?img=${(index % 50) + 10}`,
    thumbnail: recipe.thumbnail_url || getYouTubeThumbnail(recipe.youtube_url),
    duration: videoDuration || formatReelDuration(totalMinutes),
    views: formatCompactCount(stats?.views ?? 0),
    likes: formatCompactCount(stats?.likes ?? 0),
  };
}

function mapRecipeToHomeCard(
  recipe: ApiRecipeItem,
  index: number,
): HomeData["featuredRecipes"][number] {
  const totalMinutes = (recipe.preparation_time ?? 0) + (recipe.cooking_time ?? 0);

  return {
    id: String(recipe.id),
    slug: recipe.slug ?? undefined,
    title: recipe.title || `Recipe ${index + 1}`,
    description: recipe.short_description?.trim() || "",
    image:
      recipe.thumbnail_url ||
      getYouTubeThumbnail(recipe.youtube_url) ||
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
    time: formatRecipeCardTime(totalMinutes) || undefined,
    difficulty: recipe.difficulty?.trim() || undefined,
    rating: 0,
    reviews: 0,
    servings:
      recipe.servings != null && Number.isFinite(Number(recipe.servings)) && Number(recipe.servings) > 0
        ? Number(recipe.servings)
        : undefined,
    price: 0,
  };
}

async function fetchFeaturedRecipeItems(): Promise<ApiRecipeItem[]> {
  const featured = await apiRequest<RecipesResponse>("/api/recipes?featured=true&limit=6");
  if ((featured.items ?? []).length > 0) {
    return featured.items;
  }

  const latest = await apiRequest<RecipesResponse>("/api/recipes?limit=6");
  return latest.items ?? [];
}

function mapApiDiscountProduct(
  item: ApiProductItem,
  _fallbackProduct: HomeData["specialDiscounts"][number] | undefined,
  index: number,
): HomeData["specialDiscounts"][number] {
  const pricing = resolveProductPricing(item);

  return {
    id: String(item.id),
    name: item.name || `Discounted Product ${index + 1}`,
    image: resolveProductImage(item.image),
    rating: 0,
    reviewCount: 0,
    price: pricing.price,
    originalPrice: pricing.originalPrice,
    discount: pricing.discount,
    discountType: pricing.discountType,
  };
}

function mapApiTopProduct(
  item: ApiProductItem,
  fallbackProduct: HomeData["topProducts"][number] | undefined,
  index: number,
): HomeData["topProducts"][number] {
  const pricing = resolveProductPricing(item);

  return {
    id: String(item.id),
    name: item.name || `Top Product ${index + 1}`,
    image: resolveProductImage(item.image),
    rating: 0,
    reviewCount: 0,
    price: pricing.price,
    discount:
      pricing.discountType === "percentage" && pricing.discount && pricing.discount > 0
        ? pricing.discount
        : undefined,
  };
}

async function enrichWithRatings<T extends { id: string; rating: number; reviewCount: number }>(
  products: T[],
): Promise<T[]> {
  return enrichProductsWithRatings(products);
}

function mapApiHerbalProduct(
  item: ApiProductItem,
  fallbackProduct: HomeData["herbalProducts"][number] | undefined,
  index: number,
): HomeData["herbalProducts"][number] {
  const pricing = resolveProductPricing(item);

  return {
    id: String(item.id),
    name: item.name || fallbackProduct?.name || `Herbal Product ${index + 1}`,
    image:
      item.image ||
      fallbackProduct?.image ||
      "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80",
    rating: fallbackProduct?.rating ?? 4.6,
    reviewCount: fallbackProduct?.reviewCount ?? 0,
    price: pricing.price,
    originalPrice: pricing.originalPrice ?? fallbackProduct?.originalPrice,
    discount:
      pricing.discount && pricing.discount > 0 ? pricing.discount : fallbackProduct?.discount,
    discountType: pricing.discountType ?? fallbackProduct?.discountType,
  };
}

function mapApiKitchenProduct(
  item: ApiProductItem,
  fallbackProduct: HomeData["kitchenAppliances"][number] | undefined,
  index: number,
): HomeData["kitchenAppliances"][number] {
  const pricing = resolveProductPricing(item);

  return {
    id: String(item.id),
    name: item.name || fallbackProduct?.name || `Kitchen Product ${index + 1}`,
    image:
      item.image ||
      fallbackProduct?.image ||
      "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400&q=80",
    rating: fallbackProduct?.rating ?? 4.6,
    reviewCount: fallbackProduct?.reviewCount ?? 0,
    price: pricing.price,
    originalPrice: pricing.originalPrice ?? fallbackProduct?.originalPrice,
    discount:
      pricing.discount && pricing.discount > 0 ? pricing.discount : fallbackProduct?.discount,
    discountType: pricing.discountType ?? fallbackProduct?.discountType,
    brand: fallbackProduct?.brand || "Kitchen",
  };
}

function mapApiNewArrivalProduct(
  item: ApiProductItem,
  fallbackProduct: HomeData["newArrivals"][number] | undefined,
  index: number,
): HomeData["newArrivals"][number] {
  const pricing = resolveProductPricing(item);

  return {
    id: String(item.id),
    name: item.name || `New Arrival ${index + 1}`,
    image: resolveProductImage(item.image),
    rating: 0,
    reviewCount: 0,
    price: pricing.price,
    isNew: true,
  };
}

function pickCategoryIcon(slug: string, name: string) {
  const text = `${slug} ${name}`.toLowerCase();
  if (text.includes("spice") || text.includes("season")) return "flame-outline";
  if (text.includes("food") || text.includes("beverage")) return "cafe-outline";
  if (text.includes("ki") || text.includes("appliance") || text.includes("cook")) {
    return "restaurant-outline";
  }
  if (text.includes("herb") || text.includes("health")) return "leaf-outline";
  return "grid-outline";
}

function mapDbCategories(items: ApiCategoryItem[]): HomeData["categories"] {
  return items.map((item) => ({
    id: String(item.id),
    name: item.name,
    icon: pickCategoryIcon(item.slug, item.name),
    routeId: item.slug,
  }));
}

const fallbackHome = homeJson as HomeData;

export function getHomeHero(): HomeData["hero"] {
  return fallbackHome.hero;
}

function cacheProductItem(item: ApiProductItem) {
  if (!item.id) return;
  apiSpecialDiscountCache.set(String(item.id), item);
  setProductMetaFromApiRow(String(item.id), item);
}

export async function getHomeCategories(): Promise<HomeData["categories"]> {
  try {
    const response = await apiRequest<CategoriesResponse>("/api/categories");
    const mapped = mapDbCategories(response.categories ?? []);
    return mapped.length > 0 ? mapped : fallbackHome.categories;
  } catch {
    return fallbackHome.categories;
  }
}

export async function getHomeReels(): Promise<HomeData["reels"]> {
  try {
    const response = await apiRequest<RecipesResponse>("/api/recipes?limit=12");
    const reelRecipes = (response.items ?? []).filter((item) =>
      Boolean(item.youtube_url || item.thumbnail_url),
    );
    const reels = reelRecipes.map((item, index) => mapRecipeToHomeReel(item, index));
    return reels.length > 0 ? reels : fallbackHome.reels;
  } catch {
    return fallbackHome.reels;
  }
}

export async function getHomeTopProducts(): Promise<HomeData["topProducts"]> {
  await ensureTaxRulesLoaded();
  try {
    const response = await apiRequest<ProductsResponse>("/api/products?sort=popular&limit=6");
    const products = (response.data ?? []).slice(0, 6).map((item, index) => {
      cacheProductItem(item);
      return mapApiTopProduct(item, fallbackHome.topProducts[index], index);
    });
    return products.length > 0 ? products : fallbackHome.topProducts;
  } catch {
    return fallbackHome.topProducts;
  }
}

export async function getHomeNewArrivals(): Promise<HomeData["newArrivals"]> {
  await ensureTaxRulesLoaded();
  try {
    const response = await apiRequest<ProductsResponse>("/api/products?sort=newest&limit=6");
    const products = (response.data ?? []).slice(0, 6).map((item, index) => {
      cacheProductItem(item);
      return mapApiNewArrivalProduct(item, fallbackHome.newArrivals[index], index);
    });
    return products.length > 0 ? products : fallbackHome.newArrivals;
  } catch {
    return fallbackHome.newArrivals;
  }
}

export async function getHomeFeaturedRecipes(): Promise<HomeData["featuredRecipes"]> {
  try {
    const items = await fetchFeaturedRecipeItems();
    return items.map(mapRecipeToHomeCard);
  } catch {
    return [];
  }
}

export async function getHomeSpecialDiscounts(): Promise<HomeData["specialDiscounts"]> {
  await ensureTaxRulesLoaded();
  try {
    const response = await apiRequest<ProductsResponse>(
      "/api/products?sale_only=true&sort=random&limit=5",
    );
    const products = (response.data ?? []).slice(0, 5).map((item, index) => {
      cacheProductItem(item);
      return mapApiDiscountProduct(item, fallbackHome.specialDiscounts[index], index);
    });
    return products.length > 0 ? products : fallbackHome.specialDiscounts;
  } catch {
    return fallbackHome.specialDiscounts;
  }
}

export async function getHomeData(): Promise<HomeData> {
  await ensureTaxRulesLoaded();
  const fallback = fallbackHome;

  try {
    const [
      categoriesResult,
      recipesResult,
      featuredRecipesResult,
      discountsResult,
      topProductsResult,
      newArrivalsResult,
      herbalProductsResult,
      kitchenProductsResult,
    ] = await Promise.allSettled([
      apiRequest<CategoriesResponse>("/api/categories"),
      apiRequest<RecipesResponse>("/api/recipes?limit=12"),
      fetchFeaturedRecipeItems(),
      apiRequest<ProductsResponse>("/api/products?sale_only=true&sort=random&limit=5"),
      apiRequest<ProductsResponse>("/api/products?sort=popular&limit=6"),
      apiRequest<ProductsResponse>("/api/products?sort=newest&limit=6"),
      apiRequest<ProductsResponse>("/api/products?search=herbal&sort=newest&limit=6"),
      apiRequest<ProductsResponse>("/api/products?category=kitchen-appliances&sort=newest&limit=6"),
    ]);

    const apiCategories =
      categoriesResult.status === "fulfilled"
        ? mapDbCategories(categoriesResult.value.categories ?? [])
        : [];
    const recipeItems =
      recipesResult.status === "fulfilled" ? (recipesResult.value.items ?? []) : [];
    const featuredRecipeItems =
      featuredRecipesResult.status === "fulfilled" ? featuredRecipesResult.value : [];
    const reelRecipes = recipeItems.filter((item) =>
      Boolean(item.youtube_url || item.thumbnail_url),
    );
    // Skip slow external YouTube calls on initial home load.
    const reelStats: Awaited<ReturnType<typeof getYouTubeStatsMap>> = {};
    const discountItems =
      discountsResult.status === "fulfilled" ? (discountsResult.value.data ?? []) : [];
    const topProductItems =
      topProductsResult.status === "fulfilled" ? (topProductsResult.value.data ?? []) : [];
    const newArrivalItems =
      newArrivalsResult.status === "fulfilled" ? (newArrivalsResult.value.data ?? []) : [];
    const herbalItems =
      herbalProductsResult.status === "fulfilled" ? (herbalProductsResult.value.data ?? []) : [];
    const kitchenItems =
      kitchenProductsResult.status === "fulfilled" ? (kitchenProductsResult.value.data ?? []) : [];

    const apiReels = reelRecipes.map((item, index) => {
      const videoId = extractYouTubeVideoId(item.youtube_url);
      return mapRecipeToHomeReel(item, index, videoId ? reelStats[videoId] : undefined);
    });
    const apiFeaturedRecipes =
      featuredRecipeItems.length > 0
        ? await enrichRecipesWithRatings(featuredRecipeItems.map(mapRecipeToHomeCard))
        : [];
    const apiSpecialDiscounts = discountItems
      .slice(0, 5)
      .map((item, index) => {
        if (item.id) {
          apiSpecialDiscountCache.set(String(item.id), item);
          setProductMetaFromApiRow(String(item.id), item);
        }
        return mapApiDiscountProduct(item, fallback.specialDiscounts[index], index);
      });
    const apiTopProducts = topProductItems
      .slice(0, 6)
      .map((item, index) => {
        if (item.id) {
          apiSpecialDiscountCache.set(String(item.id), item);
          setProductMetaFromApiRow(String(item.id), item);
        }
        return mapApiTopProduct(item, fallback.topProducts[index], index);
      });
    const apiNewArrivals = newArrivalItems
      .slice(0, 6)
      .map((item, index) => {
        if (item.id) {
          apiSpecialDiscountCache.set(String(item.id), item);
          setProductMetaFromApiRow(String(item.id), item);
        }
        return mapApiNewArrivalProduct(item, fallback.newArrivals[index], index);
      });
    const apiHerbalProducts = herbalItems
      .slice(0, 6)
      .map((item, index) => {
        if (item.id) {
          apiSpecialDiscountCache.set(String(item.id), item);
          setProductMetaFromApiRow(String(item.id), item);
        }
        return mapApiHerbalProduct(item, fallback.herbalProducts[index], index);
      });
    const apiKitchenProducts = kitchenItems
      .slice(0, 6)
      .map((item, index) => {
        if (item.id) {
          apiSpecialDiscountCache.set(String(item.id), item);
          setProductMetaFromApiRow(String(item.id), item);
        }
        return mapApiKitchenProduct(item, fallback.kitchenAppliances[index], index);
      });

    if (
      apiReels.length === 0 &&
      apiFeaturedRecipes.length === 0 &&
      apiSpecialDiscounts.length === 0 &&
      apiTopProducts.length === 0 &&
      apiNewArrivals.length === 0 &&
      apiHerbalProducts.length === 0 &&
      apiKitchenProducts.length === 0
    ) {
      return fallback;
    }

    const topProductsWithRatings =
      apiTopProducts.length > 0 ? await enrichWithRatings(apiTopProducts) : [];
    const newArrivalsWithRatings =
      apiNewArrivals.length > 0 ? await enrichWithRatings(apiNewArrivals) : [];
    const specialDiscountsWithRatings =
      apiSpecialDiscounts.length > 0 ? await enrichWithRatings(apiSpecialDiscounts) : [];

    return {
      ...fallback,
      categories: apiCategories.length > 0 ? apiCategories : fallback.categories,
      reels: apiReels.length > 0 ? apiReels : fallback.reels,
      topProducts: topProductsWithRatings,
      newArrivals: newArrivalsWithRatings,
      herbalProducts: apiHerbalProducts,
      kitchenAppliances: apiKitchenProducts,
      featuredRecipes: apiFeaturedRecipes,
      specialDiscounts: specialDiscountsWithRatings,
    };
  } catch {
    return fallback;
  }
}
