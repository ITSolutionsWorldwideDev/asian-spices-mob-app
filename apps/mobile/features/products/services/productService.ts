import categoriesJson from "@/features/categories/data/categories.json";
import homeJson from "@/features/home/data/home.json";
import productsJson from "@/features/products/data/products.json";
import { fetchDbProductById, getCachedDbProductById, getProductRatingStats } from "@/features/categories/services/categoryService";
import {
  findHairProduct,
  hairProductToDetail,
} from "@/features/healthyLiving/services/herbalHairProductProductsService";
import {
  findSkinProduct,
  skinProductToDetail,
} from "@/features/healthyLiving/services/herbalSkinProductProductsService";
import {
  findSupplementProduct,
  supplementProductToDetail,
} from "@/features/healthyLiving/services/herbalSupplementProductsService";
import {
  getCachedApiSpecialDiscountProduct,
} from "@/features/home/services/homeService";
import { resolveProductPricing } from "@/features/products/services/productPricing";
import { fetchProductReviewList } from "@/features/products/services/reviewService";
import type { CategoryProduct } from "@/features/categories/types/category";
import type { Product, Recipe } from "@/features/home/types/home";
import type { ProductDetail, ProductDetailExtras } from "@/features/products/types/product";

type ProductsData = {
  defaults: ProductDetailExtras;
  details: Record<string, Partial<ProductDetailExtras>>;
};

const productsData = productsJson as ProductsData;
const homeData = homeJson;

function findCategoryProduct(id: string): CategoryProduct | null {
  const productsMap = categoriesJson.products as Record<string, CategoryProduct[]>;
  for (const products of Object.values(productsMap)) {
    const match = products.find((item) => item.id === id);
    if (match) return match;
  }
  return null;
}

function findHomeProduct(id: string): Product | null {
  const sections: Product[][] = [
    homeData.topProducts,
    homeData.newArrivals,
    homeData.herbalProducts,
    homeData.kitchenAppliances,
    homeData.specialDiscounts,
  ];
  for (const products of sections) {
    const match = products.find((item) => item.id === id);
    if (match) return match;
  }
  return null;
}

function findHomeRecipe(id: string): Recipe | null {
  return homeData.featuredRecipes.find((item) => item.id === id) ?? null;
}

function resolveExtras(id: string, name: string, brand?: string): ProductDetailExtras {
  const override = productsData.details[id] ?? {};
  const defaults = productsData.defaults;

  return {
    brand: override.brand ?? brand ?? defaults.brand,
    weight: override.weight ?? defaults.weight,
    description:
      override.description ??
      defaults.description.replace("spices", name.toLowerCase()),
    inStock: override.inStock ?? defaults.inStock,
    reviews: override.reviews ?? [],
  };
}

function fromCategoryProduct(product: CategoryProduct): ProductDetail {
  const extras = resolveExtras(product.id, product.name);
  return {
    id: product.id,
    name: product.name,
    image: product.image,
    rating: product.rating,
    reviewCount: product.reviewCount,
    price: product.price,
    originalPrice: product.originalPrice,
    discountPercent: product.discountPercent,
    discountType: product.discountType,
    discount: product.discount,
    ...extras,
    weight: product.weight ?? extras.weight,
    description: product.description ?? extras.description,
    healthBenefits: product.healthBenefits,
    origin: product.origin,
    category: product.category,
  };
}

function fromHomeProduct(product: Product): ProductDetail {
  const extras = resolveExtras(product.id, product.name, product.brand);
  return {
    id: product.id,
    name: product.name,
    image: product.image,
    rating: product.rating,
    reviewCount: product.reviewCount,
    price: product.price,
    originalPrice: product.originalPrice,
    discountPercent: product.discount,
    ...extras,
  };
}

function fromHomeRecipe(recipe: Recipe): ProductDetail {
  const extras = resolveExtras(recipe.id, recipe.title);
  return {
    id: recipe.id,
    name: recipe.title,
    image: recipe.image,
    rating: recipe.rating,
    reviewCount: recipe.reviews,
    price: recipe.price,
    ...extras,
    description: `${recipe.title} — ${recipe.difficulty} recipe, ready in ${recipe.time}. Serves ${recipe.servings}.`,
  };
}

function fromCachedApiSpecialDiscountProduct(
  id: string
): ProductDetail | null {
  const cached = getCachedApiSpecialDiscountProduct(id);
  if (!cached) return null;

  const name = cached.name ?? "Product";
  const pricing = resolveProductPricing(cached);
  const extras = resolveExtras(id, name);

  return {
    id,
    name,
    image:
      cached.image ??
      "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80",
    rating: 4.5,
    reviewCount: 0,
    price: pricing.price,
    originalPrice: pricing.originalPrice,
    discountPercent: pricing.discountPercent,
    discountType: pricing.discountType,
    discount: pricing.discount,
    ...extras,
    description: cached.description || extras.description,
    inStock: (cached.quantity ?? 1) > 0,
  };
}

async function withProductReviews(detail: ProductDetail): Promise<ProductDetail> {
  const [stats, reviews] = await Promise.all([
    getProductRatingStats(detail.id),
    fetchProductReviewList(detail.id),
  ]);

  const reviewCount = Math.max(stats.reviewCount, reviews.length);
  const rating =
    reviewCount > 0
      ? stats.reviewCount > 0
        ? stats.rating
        : reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length
      : 0;

  return {
    ...detail,
    rating,
    reviewCount,
    reviews,
  };
}

/** Replace with PostgreSQL/API fetch when backend is ready. */
export async function getProductById(id: string): Promise<ProductDetail | null> {
  const normalizedId = String(id);

  const apiProduct = await fetchDbProductById(normalizedId);
  if (apiProduct) return withProductReviews(fromCategoryProduct(apiProduct));

  const dbProduct = getCachedDbProductById(normalizedId);
  if (dbProduct) return withProductReviews(fromCategoryProduct(dbProduct));

  const cachedSpecialProduct = fromCachedApiSpecialDiscountProduct(normalizedId);
  if (cachedSpecialProduct) return withProductReviews(cachedSpecialProduct);

  const categoryProduct = findCategoryProduct(normalizedId);
  if (categoryProduct) return withProductReviews(fromCategoryProduct(categoryProduct));

  const homeProduct = findHomeProduct(normalizedId);
  if (homeProduct) return withProductReviews(fromHomeProduct(homeProduct));

  const homeRecipe = findHomeRecipe(normalizedId);
  if (homeRecipe) return withProductReviews(fromHomeRecipe(homeRecipe));

  const supplementProduct = findSupplementProduct(normalizedId);
  if (supplementProduct) return withProductReviews(supplementProductToDetail(supplementProduct));

  const skinProduct = findSkinProduct(normalizedId);
  if (skinProduct) return withProductReviews(skinProductToDetail(skinProduct));

  const hairProduct = findHairProduct(normalizedId);
  if (hairProduct) return withProductReviews(hairProductToDetail(hairProduct));

  return null;
}
