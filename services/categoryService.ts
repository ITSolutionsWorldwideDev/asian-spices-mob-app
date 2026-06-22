import categoriesJson from "@/data/categories.json";
import type {
  CategoryProduct,
  CategoriesPageData,
  CategoryDetailData,
  ProductFilter,
  SubCategoryProductsData,
} from "@/types/category";

const data = categoriesJson as CategoriesPageData;

/** Replace with PostgreSQL/API fetch when backend is ready. */
export async function getCategoriesData(): Promise<CategoriesPageData> {
  return data;
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

export async function getSubCategoryProducts(
  categoryId: string,
  subcategoryId: string
): Promise<SubCategoryProductsData | null> {
  const category = data.categories.find((item) => item.id === categoryId);
  if (!category) return null;

  const subcategory = (data.subcategories[categoryId] ?? []).find(
    (item) => item.id === subcategoryId
  );
  if (!subcategory) return null;

  return {
    category,
    subcategory,
    products: data.products[subcategoryId] ?? [],
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
      return cloned
        .filter((item) => item.rating >= 4.8)
        .sort((a, b) => b.rating - a.rating);
    case "popular":
    default:
      return cloned
        .filter((item) => item.popularityScore >= 80)
        .sort((a, b) => b.popularityScore - a.popularityScore);
  }
}
