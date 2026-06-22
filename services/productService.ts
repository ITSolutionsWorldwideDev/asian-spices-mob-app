import categoriesJson from "@/data/categories.json";
import homeJson from "@/data/home.json";
import productsJson from "@/data/products.json";
import {
  findSupplementProduct,
  supplementProductToDetail,
} from "@/services/herbalSupplementProductsService";
import {
  findHairProduct,
  hairProductToDetail,
} from "@/services/herbalHairProductProductsService";
import {
  findSkinProduct,
  skinProductToDetail,
} from "@/services/herbalSkinProductProductsService";
import type { CategoryProduct } from "@/types/category";
import type { Product, Recipe } from "@/types/home";
import type { ProductDetail, ProductDetailExtras } from "@/types/product";

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
    reviews: override.reviews ?? defaults.reviews,
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
    ...extras,
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

/** Replace with PostgreSQL/API fetch when backend is ready. */
export async function getProductById(id: string): Promise<ProductDetail | null> {
  const categoryProduct = findCategoryProduct(id);
  if (categoryProduct) return fromCategoryProduct(categoryProduct);

  const homeProduct = findHomeProduct(id);
  if (homeProduct) return fromHomeProduct(homeProduct);

  const homeRecipe = findHomeRecipe(id);
  if (homeRecipe) return fromHomeRecipe(homeRecipe);

  const supplementProduct = findSupplementProduct(id);
  if (supplementProduct) return supplementProductToDetail(supplementProduct);

  const skinProduct = findSkinProduct(id);
  if (skinProduct) return skinProductToDetail(skinProduct);

  const hairProduct = findHairProduct(id);
  if (hairProduct) return hairProductToDetail(hairProduct);

  return null;
}
