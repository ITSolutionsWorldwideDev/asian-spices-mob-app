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
  brandId?: string;
  weight?: string;
  description?: string;
  healthBenefits?: string;
  origin?: string;
  category?: string;
  rating: number;
  reviewCount: number;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  discountType?: "percentage" | "fixed";
  discount?: number;
  popularityScore: number;
  isFavorite?: boolean;
};

export type ProductFilter = "popular" | "lowToHigh" | "highToLow" | "topRated" | null;

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

export type BrandFilterItem = {
  id: string;
  name: string;
  productCount: number;
};

export type SubCategoryProductsData = {
  category: CategoryItem;
  subcategory: SubCategoryItem;
  products: CategoryProduct[];
  availableSubcategories?: SubCategoryItem[];
  availableBrands?: BrandFilterItem[];
  hasMore?: boolean;
};
