import profileJson from "@/data/profile.json";
import type { ProfileData, UserProfile } from "@/types/profile";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PROFILE_USER_STORAGE_KEY = "@asian_spices_profile_user";
const data = profileJson as ProfileData;

/** Replace with PostgreSQL/API fetch when backend is ready. */
export async function getUserProfile(): Promise<UserProfile> {
  const stored = await AsyncStorage.getItem(PROFILE_USER_STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored) as UserProfile;
  }
  return data.user;
}

/** Replace with PostgreSQL/API fetch when backend is ready. */
export async function getProfileData(): Promise<ProfileData> {
  const user = await getUserProfile();
  return {
    user,
    reviewCount: data.reviewCount,
  };
}

export async function saveUserProfile(user: UserProfile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_USER_STORAGE_KEY, JSON.stringify(user));
}
