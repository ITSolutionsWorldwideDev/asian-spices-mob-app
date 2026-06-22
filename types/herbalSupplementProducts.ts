export type SupplementProduct = {
  id: string;
  name: string;
  image: string;
  rating: number;
  reviewCount: number;
  price: number;
  description: string;
};

export type SupplementCategoryProducts = {
  id: string;
  title: string;
  products: SupplementProduct[];
};

export type HerbalSupplementProductsTheme = {
  headerGradient: [string, string];
  screenBackgroundColor: string;
  loadingColor: string;
};

export type HerbalSupplementProductsData = {
  theme: HerbalSupplementProductsTheme;
  categories: Record<string, SupplementCategoryProducts>;
};
