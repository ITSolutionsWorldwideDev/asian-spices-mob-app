export type UserPreferences = {
  language: string;
  country: string;
  currency: string;
};

export type SettingsData = {
  preferences: UserPreferences;
};
