import type { ProfileData, UserProfile } from "@/features/profile/types/profile";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getStoredAuthUser, refreshNextAuthSession } from "@/shared/services/api/authService";
import { ApiRequestError, apiRequest } from "@/shared/services/api/httpClient";

const PROFILE_USER_STORAGE_KEY = "@asian_spices_profile_user";
const AVATAR_KEY = (email: string) =>
  `@asian_spices_avatar:${email.trim().toLowerCase()}`;

async function getSavedAvatar(email?: string | null): Promise<string> {
  if (!email?.trim()) return "";
  return (await AsyncStorage.getItem(AVATAR_KEY(email))) ?? "";
}

async function saveAvatar(email: string, avatar: string): Promise<void> {
  if (!email.trim()) return;
  if (avatar) {
    await AsyncStorage.setItem(AVATAR_KEY(email), avatar);
    return;
  }
  await AsyncStorage.removeItem(AVATAR_KEY(email));
}

type BackendProfileUser = {
  id?: string | number | null;
  email?: string | null;
  name?: string | null;
  displayname?: string | null;
  phone?: string | null;
  first_name?: string | null;
  last_name?: string | null;
};

type BackendProfileResponse = {
  user?: BackendProfileUser | null;
};

async function apiRequestWithSessionRetry<T>(
  path: string,
  options?: Omit<RequestInit, "body"> & { body?: unknown },
): Promise<T> {
  try {
    return await apiRequest<T>(path, options);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) {
      const refreshed = await refreshNextAuthSession();
      if (refreshed) {
        return apiRequest<T>(path, options);
      }
    }
    throw error;
  }
}

function mapAuthUserToProfile(
  authUser: Awaited<ReturnType<typeof getStoredAuthUser>>,
  storedProfile: UserProfile | null,
): UserProfile | null {
  if (!authUser) return null;

  return {
    name: authUser.name?.trim() || authUser.email?.split("@")[0] || "User",
    email: authUser.email,
    phone: storedProfile?.phone || "",
    avatar: storedProfile?.avatar || "",
    bio: storedProfile?.bio,
  };
}

function buildFallbackProfile(
  storedProfile: UserProfile | null,
  authProfile: UserProfile | null,
): UserProfile {
  if (authProfile) return authProfile;
  if (storedProfile) return storedProfile;

  return {
    name: "User",
    email: "",
    phone: "",
    avatar: "",
    bio: "",
  };
}

function parseStoredProfile(stored: string | null): UserProfile | null {
  if (!stored) return null;
  try {
    return JSON.parse(stored) as UserProfile;
  } catch {
    return null;
  }
}

function normalizeName(user?: BackendProfileUser | null): string {
  const displayName = user?.displayname?.trim();
  if (displayName) return displayName;

  const name = user?.name?.trim();
  if (name) return name;

  const fromParts = `${user?.first_name?.trim() ?? ""} ${user?.last_name?.trim() ?? ""}`.trim();
  if (fromParts) return fromParts;

  const email = user?.email?.trim();
  if (email) return email.split("@")[0] ?? email;

  return "User";
}

function normalizeBackendProfile(
  payload: BackendProfileResponse,
  storedProfile: UserProfile | null,
  avatar = "",
): UserProfile {
  const backendUser = payload.user;
  return {
    name: normalizeName(backendUser),
    email: backendUser?.email?.trim() || storedProfile?.email || "",
    phone: backendUser?.phone?.trim() || storedProfile?.phone || "",
    avatar,
    bio: storedProfile?.bio,
  };
}

export async function getUserProfile(): Promise<UserProfile> {
  const storedProfile = parseStoredProfile(await AsyncStorage.getItem(PROFILE_USER_STORAGE_KEY));
  try {
    const payload = await apiRequestWithSessionRetry<BackendProfileResponse>(
      "/api/account/profile",
    );
    const email = payload.user?.email?.trim() || storedProfile?.email || "";
    const user = normalizeBackendProfile(
      payload,
      storedProfile,
      await getSavedAvatar(email),
    );
    await AsyncStorage.setItem(PROFILE_USER_STORAGE_KEY, JSON.stringify(user));
    return user;
  } catch (error) {
    const authUser = await getStoredAuthUser();
    const authProfile = mapAuthUserToProfile(authUser, storedProfile);
    const fallbackUser = buildFallbackProfile(storedProfile, authProfile);
    fallbackUser.avatar = await getSavedAvatar(fallbackUser.email || authUser?.email);

    if (error instanceof ApiRequestError && error.status === 401) {
      await AsyncStorage.setItem(PROFILE_USER_STORAGE_KEY, JSON.stringify(fallbackUser));
      return fallbackUser;
    }

    if (storedProfile || authProfile) {
      await AsyncStorage.setItem(PROFILE_USER_STORAGE_KEY, JSON.stringify(fallbackUser));
      return fallbackUser;
    }

    return fallbackUser;
  }
}

export async function getProfileData(): Promise<ProfileData> {
  const user = await getUserProfile();
  return {
    user,
    reviewCount: 0,
  };
}

export async function saveUserProfile(user: UserProfile): Promise<void> {
  await apiRequestWithSessionRetry<{ success: boolean }>("/api/account/profile", {
    method: "PUT",
    body: {
      name: user.name,
      phone: user.phone,
    },
  });

  await AsyncStorage.setItem(PROFILE_USER_STORAGE_KEY, JSON.stringify(user));
  await saveAvatar(user.email, user.avatar);
}

export async function changePassword(params: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await apiRequestWithSessionRetry<{ success: boolean }>("/api/account/change-password", {
    method: "POST",
    body: {
      currentPassword: params.currentPassword,
      newPassword: params.newPassword,
    },
  });
}
