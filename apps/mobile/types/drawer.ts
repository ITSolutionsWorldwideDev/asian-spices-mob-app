import { Ionicons } from "@expo/vector-icons";

export type HealthyLivingItem = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  route?: string;
};

export type DrawerNavItem = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route?: string;
};

export type DrawerMenuData = {
  mainLinks: DrawerNavItem[];
  healthyLivingItems: HealthyLivingItem[];
  bottomLinks: DrawerNavItem[];
};
