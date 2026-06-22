import { Ionicons } from "@expo/vector-icons";

export type HealthyLivingItem = {
  id: string;
  title: string;
  subtitle: string;
  backgroundColor: string;
  iconColor: string;
  icon: keyof typeof Ionicons.glyphMap;
  route?: string;
};

export type DrawerLink = {
  id: string;
  label: string;
};

export type DrawerMenuData = {
  healthyLivingItems: HealthyLivingItem[];
  bottomLinks: DrawerLink[];
};
