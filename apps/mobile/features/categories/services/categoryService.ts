import categoriesJson from "@/features/categories/data/categories.json";
import { apiRequest } from "@/shared/services/api/httpClient";
import { setProductMetaFromApiRow } from "@/shared/services/api/productMetaCache";
import { resolveProductPricing } from "@/features/products/services/productPricing";
import { ensureTaxRulesLoaded } from "@/features/cart/services/taxService";
import type {
    CategoriesPageData,
    CategoryDetailData,
    CategoryProduct,
    ProductFilter,
    SubCategoryItem,
    SubCategoryProductsData,
} from "@/features/categories/types/category";

const data = categoriesJson as CategoriesPageData;
const PRODUCT_IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80";

type BackendCategoryResponse = {
  category?: {
    id: string;
    slug: string;
    name?: string;
  };
  subcategories?: Array<{
    id: string;
    name: string;
    product_count?: number;
  }>;
  brands?: Array<{
    brand_id: string;
    name: string;
    product_count?: number;
  }>;
  error?: string;
};

type BackendProduct = {
  id: string;
  category_id?: string | null;
  name?: string | null;
  image?: string | null;
  brand_id?: string | null;
  brand_name?: string | null;
  weight?: string | null;
  description?: string | null;
  health_benefits?: string | null;
  country_of_origin?: string | null;
  category_name?: string | null;
  subcategory_id?: string | null;
  base_price?: number | string | null;
  sale_price?: number | string | null;
  min_offered_price?: number | string | null;
  discount_type?: string | null;
  discount_value?: number | string | null;
  unit?: string | null;
};

type BackendProductsResponse = {
  data?: BackendProduct[];
  total?: number;
};

export const CATEGORY_PRODUCTS_PAGE_SIZE = 20;

type ProductQueryOptions = {
  search?: string;
  minPrice?: string;
  maxPrice?: string;
  brandIds?: string[];
  subcategoryIds?: string[];
  limit?: number;
  page?: number;
};

const CATEGORY_SLUGS_BY_ID: Record<string, string[]> = {
  "1": ["spices", "asian-spices-seasoning", "asian-spices-and-seasoning"],
  "2": [
    "foods-beverages",
    "foods-and-beverages",
    "asian-food-beverages",
    "asian-foods-beverages",
    "asian-foods-and-beverages",
    "asian-foods",
  ],
  "3": [
    "kitchen-appliances-cookinng-tools",
    "kitchen-appliances-cooking-tools",
    "kitchen-appliances-and-cooking-tools",
    "kitchen-appliances-tools",
    "kitchen-appliances",
    "kitchen-tools",
    "cooking-tools",
  ],
};

const dbProductCache = new Map<string, CategoryProduct>();
const productRatingCache = new Map<string, { rating: number; reviewCount: number }>();
const CATEGORY_COUNT_PAGE_SIZE = 200;

type ProductReviewStatsResponse = {
  total?: number;
  average?: number | string;
};

function titleToSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function categorySlugCandidates(categoryId: string, title: string): string[] {
  const fromMap = CATEGORY_SLUGS_BY_ID[categoryId] ?? [];
  return Array.from(new Set([...fromMap, titleToSlug(title)]));
}

async function fetchBackendCategoryBySlug(slug: string) {
  try {
    const response = await apiRequest<BackendCategoryResponse>(
      `/api/category/${encodeURIComponent(slug)}`,
    );
    if (response.category?.slug) {
      return {
        slug: response.category.slug,
        name: response.category.name,
        subcategories: response.subcategories ?? [],
        brands: response.brands ?? [],
      };
    }
  } catch {
    // Ignore and fall back below.
  }
  return null;
}

async function resolveBackendCategory(categoryId: string, title: string) {
  const candidates = categorySlugCandidates(categoryId, title);

  for (const slug of candidates) {
    try {
      const response = await apiRequest<BackendCategoryResponse>(`/api/category/${slug}`);
      if (response.category?.slug && Array.isArray(response.subcategories)) {
        return {
          slug: response.category.slug,
          subcategories: response.subcategories,
          brands: response.brands ?? [],
        };
      }
    } catch {
      // Try next possible slug.
    }
  }

  // Some categories may not resolve through /api/category/[slug] but still work on /api/products.
  for (const slug of candidates) {
    try {
      const probe = await apiRequest<BackendProductsResponse>(
        `/api/products?category=${encodeURIComponent(slug)}&limit=1`
      );
      if ((probe.data?.length ?? 0) > 0) {
        return {
          slug,
          subcategories: [],
          brands: [],
        };
      }
    } catch {
      // Ignore and continue probing.
    }
  }

  return null;
}

async function fetchProductRatingStats(productId: string) {
  const cached = productRatingCache.get(productId);
  if (cached) {
    return cached;
  }

  try {
    const response = await apiRequest<ProductReviewStatsResponse>(
      `/api/products/reviews?productId=${encodeURIComponent(productId)}&page=1`,
    );
    const average = Number(response.average ?? 0);
    const total = Number(response.total ?? 0);
    const stats = {
      rating: total > 0 && Number.isFinite(average) ? average : 0,
      reviewCount: Number.isFinite(total) ? total : 0,
    };
    if (stats.reviewCount > 0) {
      productRatingCache.set(productId, stats);
    }
    return stats;
  } catch {
    return { rating: 0, reviewCount: 0 };
  }
}

export async function getProductRatingStats(productId: string) {
  return fetchProductRatingStats(productId);
}

export function clearProductRatingCache(productId?: string) {
  if (productId) {
    productRatingCache.delete(productId);
    return;
  }
  productRatingCache.clear();
}

export async function enrichProductsWithRatings<
  T extends { id: string; rating: number; reviewCount: number },
>(products: T[]): Promise<T[]> {
  const CHUNK_SIZE = 10;
  const enriched = [...products];

  for (let start = 0; start < enriched.length; start += CHUNK_SIZE) {
    const chunk = enriched.slice(start, start + CHUNK_SIZE);
    const statsList = await Promise.all(
      chunk.map((product) => fetchProductRatingStats(product.id)),
    );

    chunk.forEach((product, index) => {
      const stats = statsList[index];
      enriched[start + index] = {
        ...product,
        rating: stats.reviewCount > 0 ? stats.rating : 0,
        reviewCount: stats.reviewCount,
      };
    });
  }

  return enriched;
}

export function mapApiProductToCategory(
  raw: BackendProduct,
  subcategoryId: string,
  index: number,
): CategoryProduct {
  return toCategoryProduct(raw, subcategoryId, index);
}

function toCategoryProduct(raw: BackendProduct, subcategoryId: string, index: number): CategoryProduct {
  const pricing = resolveProductPricing(raw);

  return {
    id: String(raw.id),
    subcategoryId: raw.subcategory_id ?? subcategoryId,
    name: raw.name ?? "Product",
    image: raw.image ?? PRODUCT_IMAGE_FALLBACK,
    brandId: raw.brand_id ?? undefined,
    weight: raw.weight?.trim() || raw.unit?.trim() || undefined,
    description: raw.description?.trim() || undefined,
    healthBenefits: raw.health_benefits?.trim() || undefined,
    origin: raw.country_of_origin?.trim() || undefined,
    category: raw.category_name?.trim() || undefined,
    rating: 0,
    reviewCount: 0,
    price: pricing.price,
    originalPrice: pricing.originalPrice,
    discountPercent: pricing.discountPercent,
    discountType: pricing.discountType,
    discount: pricing.discount,
    popularityScore: Math.max(1, 100 - index),
  };
}

function localAllProductsByCategory(categoryId: string) {
  return Object.entries(data.products)
    .filter(([key]) => key.startsWith(`${categoryId}-`))
    .flatMap(([, value]) => value);
}

async function countAllProductsForCategory(slug: string): Promise<number> {
  let page = 1;
  let total = 0;

  while (true) {
    const response = await apiRequest<BackendProductsResponse>(
      `/api/products?category=${encodeURIComponent(slug)}&page=${page}&limit=${CATEGORY_COUNT_PAGE_SIZE}`
    );
    const pageCount = response.data?.length ?? 0;
    total += pageCount;

    if (pageCount < CATEGORY_COUNT_PAGE_SIZE) {
      break;
    }
    page += 1;
  }

  return total;
}

export function getCachedDbProductById(productId: string): CategoryProduct | null {
  return dbProductCache.get(String(productId)) ?? null;
}

export function cacheDbProducts(products: CategoryProduct[]) {
  for (const product of products) {
    dbProductCache.set(String(product.id), product);
  }
}

export async function fetchDbProductById(productId: string): Promise<CategoryProduct | null> {
  await ensureTaxRulesLoaded();
  const normalizedId = String(productId);

  try {
    const response = await apiRequest<BackendProductsResponse>(
      `/api/products?id=${encodeURIComponent(normalizedId)}`,
    );
    const raw = response.data?.[0];
    if (!raw?.id) {
      return getCachedDbProductById(normalizedId);
    }

    const product = toCategoryProduct(raw, raw.subcategory_id ?? "detail", 0);
    dbProductCache.set(String(product.id), product);
    if (raw.category_id || raw.base_price != null) {
      setProductMetaFromApiRow(String(raw.id), raw);
    }
    return product;
  } catch {
    return getCachedDbProductById(normalizedId);
  }
}

function pickCategoryEmoji(slug: string, name: string) {
  const text = `${slug} ${name}`.toLowerCase();
  if (text.includes("spice") || text.includes("season")) return "🌶️";
  if (text.includes("food") || text.includes("beverage")) return "🍜";
  if (text.includes("kitchen") || text.includes("appliance") || text.includes("cook")) {
    return "🔪";
  }
  if (text.includes("herb") || text.includes("health")) return "🌿";
  return "📦";
}

function pickCategoryDescription(slug: string, name: string) {
  const text = `${slug} ${name}`.toLowerCase();
  if (text.includes("spice") || text.includes("season")) {
    return "Whole spices, blends and seasoning mixes";
  }
  if (text.includes("food") || text.includes("beverage")) {
    return "Snacks, sauces, drinks and pantry staples";
  }
  if (text.includes("kitchen") || text.includes("appliance") || text.includes("cook")) {
    return "Grinders, cookware and prep tools";
  }
  return `Browse ${name}`;
}

/** Replace with PostgreSQL/API fetch when backend is ready. */
export async function getCategoriesData(): Promise<CategoriesPageData> {
  try {
    const response = await apiRequest<{
      categories?: Array<{
        id: string;
        name: string;
        slug: string;
        product_count?: number;
      }>;
    }>("/api/categories");

    const rows = response.categories ?? [];
    if (rows.length > 0) {
      return {
        ...data,
        categories: rows.map((category) => ({
          id: category.slug,
          title: category.name,
          emoji: pickCategoryEmoji(category.slug, category.name),
          description: pickCategoryDescription(category.slug, category.name),
          productCount: Number(category.product_count ?? 0),
          image: "",
        })),
      };
    }
  } catch {
    // Fall back to local JSON below.
  }

  const nextData: CategoriesPageData = {
    ...data,
    categories: data.categories.map((item) => ({ ...item })),
  };

  await Promise.all(
    nextData.categories.map(async (category) => {
      try {
        const backendCategory = await resolveBackendCategory(category.id, category.title);
        if (!backendCategory) return;

        const exactCount = await countAllProductsForCategory(backendCategory.slug);
        category.productCount = exactCount;
      } catch {
        // Keep JSON fallback count if API request fails.
      }
    })
  );

  return nextData;
}

export async function getCategoryDetail(
  categoryId: string
): Promise<CategoryDetailData | null> {
  const category = data.categories.find((item) => item.id === categoryId);
  if (!category) return null;

  return {
    category,
    subcategories: data.subcategories[categoryId] ?? [],
  };
}

async function fetchFilteredBrands(slug: string, subcategoryIds: string[]) {
  try {
    const params = new URLSearchParams();
    if (subcategoryIds.length > 0) {
      params.set("subcategories", subcategoryIds.join(","));
    }

    const query = params.toString();
    const response = await apiRequest<BackendCategoryResponse>(
      `/api/category/${encodeURIComponent(slug)}${query ? `?${query}` : ""}`,
    );

    return response.brands ?? [];
  } catch {
    return [];
  }
}

function buildAvailableBrands(
  filteredBrands: Array<{ brand_id: string; name?: string; product_count?: number }>,
) {
  return filteredBrands.map((brand) => ({
    id: brand.brand_id,
    name: brand.name?.trim() || "Unknown Brand",
    productCount: Number(brand.product_count ?? 0),
  }));
}

export async function getSubCategoryProducts(
  categoryId: string,
  subcategoryId: string,
  options: ProductQueryOptions = {}
): Promise<SubCategoryProductsData | null> {
  await ensureTaxRulesLoaded();
  const category = data.categories.find((item) => item.id === categoryId);
  const isAll = subcategoryId === "all";

  const backendCategory = category
    ? await resolveBackendCategory(categoryId, category.title)
    : await fetchBackendCategoryBySlug(categoryId);

  if (backendCategory) {
    try {
      const limit = options.limit ?? CATEGORY_PRODUCTS_PAGE_SIZE;
      const page = options.page ?? 1;
      const params = new URLSearchParams();
      params.set("category", backendCategory.slug);
      params.set("limit", String(limit));
      params.set("page", String(page));
      if (!isAll) {
        params.set("subcategories", subcategoryId);
      } else if (options.subcategoryIds?.length) {
        params.set("subcategories", options.subcategoryIds.join(","));
      }
      if (options.search?.trim()) {
        params.set("search", options.search.trim());
      }
      if (options.minPrice?.trim()) {
        params.set("min", options.minPrice.trim());
      }
      if (options.maxPrice?.trim()) {
        params.set("max", options.maxPrice.trim());
      }
      if (options.brandIds?.length) {
        params.set("brands", options.brandIds.join(","));
      }

      const endpoint = `/api/products?${params.toString()}`;
      const response = await apiRequest<BackendProductsResponse>(endpoint);
      const mappedProducts = (response.data ?? []).map((item, index) =>
        toCategoryProduct(item, isAll ? "all" : subcategoryId, index),
      );
      const products = mappedProducts;
      const hasMore = mappedProducts.length >= limit;
      const totalCount = response.total ?? products.length;

      for (const product of products) {
        dbProductCache.set(String(product.id), product);
      }

      for (const raw of response.data ?? []) {
        if (raw.id) {
          setProductMetaFromApiRow(String(raw.id), raw);
        }
      }

      const displayCategory = category
        ? { ...category, productCount: totalCount }
        : {
            id: categoryId,
            title: categoryId.replace(/-/g, " "),
            emoji: "📦",
            description: "",
            productCount: totalCount,
            image: PRODUCT_IMAGE_FALLBACK,
          };

      const subcategoryFilter = !isAll
        ? [subcategoryId]
        : options.subcategoryIds ?? [];
      const filteredBrands =
        page === 1
          ? await fetchFilteredBrands(backendCategory.slug, subcategoryFilter)
          : [];

      const mappedSubcategory: SubCategoryItem = isAll
        ? {
            id: "all",
            title: displayCategory.title,
            productCount: totalCount,
            image: displayCategory.image,
          }
        : {
            id: subcategoryId,
            title:
              backendCategory.subcategories.find((sub) => sub.id === subcategoryId)?.name ??
              "Products",
            productCount: totalCount,
            image:
              data.subcategories[categoryId]?.find((item) => item.id === subcategoryId)?.image ??
              displayCategory.image,
          };

      return {
        category: displayCategory,
        subcategory: mappedSubcategory,
        products,
        hasMore,
        availableSubcategories: backendCategory.subcategories.map((sub, index) => ({
          id: sub.id,
          title: sub.name,
          productCount: Number(sub.product_count ?? 0),
          image: data.subcategories[categoryId]?.[index]?.image ?? displayCategory.image,
        })),
        availableBrands: page === 1 ? buildAvailableBrands(filteredBrands) : undefined,
      };
    } catch {
      // Fall back to local JSON data when API fails.
    }
  }

  if (!category) return null;

  if (isAll) {
    const products = localAllProductsByCategory(categoryId);
    return {
      category,
      subcategory: {
        id: "all",
        title: category.title,
        productCount: products.length,
        image: category.image,
      },
      products,
      availableSubcategories: data.subcategories[categoryId] ?? [],
    };
  }

  const subcategory = (data.subcategories[categoryId] ?? []).find(
    (item) => item.id === subcategoryId
  );
  if (!subcategory) return null;

  return {
    category,
    subcategory,
    products: data.products[subcategoryId] ?? [],
    availableSubcategories: data.subcategories[categoryId] ?? [],
  };
}

export function applyProductFilter(
  products: CategoryProduct[],
  filter: ProductFilter
): CategoryProduct[] {
  const cloned = [...products];
  switch (filter) {
    case "lowToHigh":
      return cloned.sort((a, b) => a.price - b.price);
    case "highToLow":
      return cloned.sort((a, b) => b.price - a.price);
    case "topRated":
      return cloned.sort((a, b) => {
        if (b.rating !== a.rating) {
          return b.rating - a.rating;
        }
        return b.reviewCount - a.reviewCount;
      });
    case "popular":
      return cloned
        .filter((item) => item.popularityScore >= 80)
        .sort((a, b) => b.popularityScore - a.popularityScore);
    default:
      // No filter selected — show products in original order.
      return cloned;
  }
}
