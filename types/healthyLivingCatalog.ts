import { Ionicons } from "@expo/vector-icons";

export type CatalogCategory = {
  id: string;
  title: string;
  description: string;
  productCount: number;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  backgroundColor: string;
};

export type CatalogTheme = {
  headerGradient: [string, string];
  screenBackgroundColor: string;
  introBackgroundColor: string;
  qualityBannerBackground: string;
  loadingColor: string;
};

export type CatalogBanner = {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
};

export type HealthyLivingCatalogData = {
  title: string;
  subtitle: string;
  introDescription: string;
  categoriesSectionTitle: string;
  theme: CatalogTheme;
  categories: CatalogCategory[];
  qualityBanner: CatalogBanner;
  categoryRoute: string;
};

export type CatalogProduct = {
  id: string;
  name: string;
  image: string;
  rating: number;
  reviewCount: number;
  price: number;
  description: string;
};

export type CatalogCategoryProducts = {
  id: string;
  title: string;
  products: CatalogProduct[];
};

export type HealthyLivingCategoryProductsData = {
  theme: {
    headerGradient: [string, string];
    screenBackgroundColor: string;
    loadingColor: string;
  };
  categories: Record<string, CatalogCategoryProducts>;
};
