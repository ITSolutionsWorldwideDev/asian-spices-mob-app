import { Ionicons } from "@expo/vector-icons";

export type SupplementCategory = {
  id: string;
  title: string;
  description: string;
  productCount: number;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  backgroundColor: string;
};

export type HerbalSupplementsTheme = {
  headerGradient: [string, string];
  screenBackgroundColor: string;
  introBackgroundColor: string;
  qualityBannerBackground: string;
  loadingColor: string;
};

export type QualityBanner = {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
};

export type HerbalFoodSupplementsData = {
  title: string;
  subtitle: string;
  introDescription: string;
  categoriesSectionTitle: string;
  theme: HerbalSupplementsTheme;
  categories: SupplementCategory[];
  qualityBanner: QualityBanner;
};
