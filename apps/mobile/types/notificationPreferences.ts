export type NotificationPreferences = {
  pushEnabled: boolean;
  orderUpdates: boolean;
  recipeReelUpdates: boolean;
  newProducts: boolean;
  priceDrops: boolean;
  restockAlerts: boolean;
  promotionalEmails: boolean;
};

export type NotificationPreferenceKey = keyof NotificationPreferences;

export type NotificationPreferenceItem = {
  key: NotificationPreferenceKey;
  title: string;
  subtitle: string;
};

export type NotificationPreferenceSection = {
  title: string;
  items: NotificationPreferenceItem[];
};
