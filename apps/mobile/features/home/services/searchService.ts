import { apiRequest } from "@/shared/services/api/httpClient";
import { setProductMetaFromApiRow } from "@/shared/services/api/productMetaCache";
import { getYouTubeThumbnail } from "@/shared/services/api/recipeVideo";
import { cacheDbProducts, getProductRatingStats, mapApiProductToCategory } from "@/features/categories/services/categoryService";
import { ensureTaxRulesLoaded } from "@/features/cart/services/taxService";
import type { RecipeListItem } from "@/features/recipes/services/recipeService";
import type { CategoryProduct } from "@/features/categories/types/category";

const PRODUCT_IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80";

type BackendProduct = {
  id: string;
  category_id?: string | null;
  name?: string | null;
  image?: string | null;
  brand_id?: string | null;
  subcategory_id?: string | null;
  base_price?: number | string | null;
  sale_price?: number | string | null;
  min_offered_price?: number | string | null;
};

type BackendProductsResponse = {
  data?: BackendProduct[];
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
  tags?: Array<{ id: string; name: string; slug: string }>;
};

type RecipesResponse = {
  success: boolean;
  items: ApiRecipeItem[];
};

export type SearchResults = {
  products: CategoryProduct[];
  recipes: RecipeListItem[];
};

function formatRecipeTime(minutes: number) {
  if (minutes <= 0) return "N/A";
  if (minutes < 60) return `${minutes}min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

function toRecipeListItem(item: ApiRecipeItem, index: number): RecipeListItem {
  const totalMinutes = (item.preparation_time ?? 0) + (item.cooking_time ?? 0);

  return {
    id: String(item.id),
    slug: item.slug ?? undefined,
    title: item.title || `Recipe ${index + 1}`,
    description: item.short_description || "",
    image:
      item.thumbnail_url ||
      getYouTubeThumbnail(item.youtube_url) ||
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
    category: item.category_name?.trim() || "Recipes",
    tags: (item.tags ?? [])
      .map((tag) => tag?.name?.trim())
      .filter((tag): tag is string => Boolean(tag)),
    time: formatRecipeTime(totalMinutes),
    difficulty: item.difficulty || "Medium",
    rating: 4.8,
    reviews: 0,
    servings: item.servings ?? 2,
    price: 0,
  };
}

async function searchProducts(query: string): Promise<CategoryProduct[]> {
  await ensureTaxRulesLoaded();
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  try {
    const response = await apiRequest<BackendProductsResponse>(
      `/api/products?category=all&search=${encodeURIComponent(trimmed)}&limit=40&sort=relevance`,
    );

    return (response.data ?? []).map((raw, index) => {
      if (raw.id && raw.category_id) {
        setProductMetaFromApiRow(String(raw.id), raw);
      }
      return mapApiProductToCategory(raw, raw.subcategory_id ?? "search", index);
    });
  } catch (error) {
    console.error("Product search failed:", error);
    return [];
  }
}

async function searchRecipes(query: string): Promise<RecipeListItem[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  try {
    const response = await apiRequest<RecipesResponse>(
      `/api/recipes?search=${encodeURIComponent(trimmed)}&limit=20`,
    );

    return (response.items ?? []).map((item, index) => toRecipeListItem(item, index));
  } catch {
    return [];
  }
}

async function fetchProductsBySort(
  sort: "popular" | "newest",
  page = 1,
  limit = 20,
  saleOnly = false,
) {
  await ensureTaxRulesLoaded();
  const saleParam = saleOnly ? "&sale_only=true" : "";
  const response = await apiRequest<BackendProductsResponse>(
    `/api/products?sort=${sort}&limit=${limit}&page=${page}${saleParam}`,
  );

  const products = await Promise.all(
    (response.data ?? []).map(async (raw, index) => {
      if (raw.id && raw.category_id) {
        setProductMetaFromApiRow(String(raw.id), raw);
      }
      const product = mapApiProductToCategory(raw, raw.subcategory_id ?? sort, index);
      const stats = await getProductRatingStats(product.id);
      return {
        ...product,
        rating: stats.reviewCount > 0 ? stats.rating : 0,
        reviewCount: stats.reviewCount,
      };
    }),
  );

  cacheDbProducts(products);

  return {
    products,
    hasMore: products.length >= limit,
  };
}

export async function fetchPopularProducts(page = 1, limit = 20) {
  return fetchProductsBySort("popular", page, limit);
}

export async function fetchNewArrivalProducts(page = 1, limit = 20) {
  return fetchProductsBySort("newest", page, limit);
}

export async function fetchDiscountProducts(page = 1, limit = 20) {
  return fetchProductsBySort("newest", page, limit, true);
}

export async function searchCatalog(query: string): Promise<SearchResults> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { products: [], recipes: [] };
  }

  const [products, recipes] = await Promise.all([
    searchProducts(trimmed),
    searchRecipes(trimmed),
  ]);

  return { products, recipes };
}
