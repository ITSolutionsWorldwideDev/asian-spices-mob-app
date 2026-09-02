import productsJson from "@/data/herbalSupplementProducts.json";
import type {
  HerbalSupplementProductsData,
  SupplementCategoryProducts,
  SupplementProduct,
} from "@/types/herbalSupplementProducts";
import type { ProductDetail } from "@/types/product";

const data = productsJson as unknown as HerbalSupplementProductsData;

export function findSupplementProduct(id: string): SupplementProduct | null {
  for (const category of Object.values(data.categories)) {
    const match = category.products.find((product) => product.id === id);
    if (match) return match;
  }
  return null;
}

export function supplementProductToDetail(product: SupplementProduct): ProductDetail {
  return {
    id: product.id,
    name: product.name,
    image: product.image,
    rating: product.rating,
    reviewCount: product.reviewCount,
    price: product.price,
    brand: "Asian Spices",
    weight: "60 count",
    description: product.description,
    inStock: true,
    reviews: [],
  };
}

/** Replace with PostgreSQL/API fetch when backend is ready. */
export async function getSupplementCategoryProducts(
  categoryId: string
): Promise<SupplementCategoryProducts | null> {
  return data.categories[categoryId] ?? null;
}

export async function getHerbalSupplementProductsTheme() {
  return data.theme;
}
