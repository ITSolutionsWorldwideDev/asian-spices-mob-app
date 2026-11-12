import productsJson from "@/features/healthy-living/herbal-hair/data/herbalHairProductProducts.json";
import type {
  CatalogCategoryProducts,
  CatalogProduct,
  HealthyLivingCategoryProductsData,
} from "@/features/healthy-living/types/healthyLivingCatalog";
import type { ProductDetail } from "@/features/products/types/product";

const data = productsJson as unknown as HealthyLivingCategoryProductsData;

export function findHairProduct(id: string): CatalogProduct | null {
  for (const category of Object.values(data.categories)) {
    const match = category.products.find((product) => product.id === id);
    if (match) return match;
  }
  return null;
}

export function hairProductToDetail(product: CatalogProduct): ProductDetail {
  return {
    id: product.id,
    name: product.name,
    image: product.image,
    rating: product.rating,
    reviewCount: product.reviewCount,
    price: product.price,
    brand: "Asian Spices",
    weight: "200ml",
    description: product.description,
    inStock: true,
    reviews: [],
  };
}

/** Replace with PostgreSQL/API fetch when backend is ready. */
export async function getHairCategoryProducts(
  categoryId: string
): Promise<CatalogCategoryProducts | null> {
  return data.categories[categoryId] ?? null;
}

export async function getHerbalHairProductsTheme() {
  return data.theme;
}
