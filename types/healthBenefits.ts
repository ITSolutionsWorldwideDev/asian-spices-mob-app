import { Ionicons } from "@expo/vector-icons";

export type HerbBenefit = {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  backgroundColor: string;
};

export type HealthBenefitsTheme = {
  headerGradient: [string, string];
  introBackgroundColor: string;
  screenBackgroundColor: string;
  loadingColor: string;
};

export type HealthBenefitsData = {
  title: string;
  subtitle: string;
  introTitle: string;
  introDescription: string;
  theme: HealthBenefitsTheme;
  benefits: HerbBenefit[];
};
