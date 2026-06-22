export type CategoryItem = {
  id: string;
  title: string;
  emoji: string;
  description: string;
  productCount: number;
  image: string;
};

export type SubCategoryItem = {
  id: string;
  title: string;
  productCount: number;
  image: string;
};

export type CategoryProduct = {
  id: string;
  subcategoryId: string;
  name: string;
  image: string;
  rating: number;
  reviewCount: number;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  popularityScore: number;
  isFavorite?: boolean;
};

export type ProductFilter = "popular" | "lowToHigh" | "highToLow" | "topRated";

export type CategoriesPageData = {
  pageTitle: string;
  pageSubtitle: string;
  categories: CategoryItem[];
  subcategories: Record<string, SubCategoryItem[]>;
  products: Record<string, CategoryProduct[]>;
};

export type CategoryDetailData = {
  category: CategoryItem;
  subcategories: SubCategoryItem[];
};

export type SubCategoryProductsData = {
  category: CategoryItem;
  subcategory: SubCategoryItem;
  products: CategoryProduct[];
};
