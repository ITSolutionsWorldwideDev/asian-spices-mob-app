import reelsJson from "@/features/reels/data/reels.json";
import { refreshNextAuthSession } from "@/features/auth/services/authService";
import { ApiRequestError, apiRequest } from "@/shared/services/api/httpClient";
import {
  extractYouTubeVideoId,
  formatCompactCount,
  formatVideoClock,
  getYouTubeStatsMap,
  getYouTubeThumbnail,
} from "@/shared/services/api/recipeVideo";
import type { RecipeTag, ReelItem, UploadReelInput } from "@/features/reels/types/reel";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

const STORAGE_KEY = "@asian_spices_user_reels";

const defaultReels = reelsJson.reels as ReelItem[];

type ApiRecipeItem = {
  id: string;
  title: string;
  short_description?: string | null;
  thumbnail_url?: string | null;
  youtube_url?: string | null;
  preparation_time?: number | null;
  cooking_time?: number | null;
  category_name?: string | null;
};

type RecipesResponse = {
  success: boolean;
  items: ApiRecipeItem[];
};

function formatDuration(minutes?: number | null) {
  if (!minutes || minutes <= 0) return "N/A";
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs <= 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

function mapRecipeToReel(
  recipe: ApiRecipeItem,
  index: number,
  stats?: { likes: number; views: number; comments: number; durationSeconds?: number },
): ReelItem {
  const totalMinutes = (recipe.preparation_time ?? 0) + (recipe.cooking_time ?? 0);
  const source = recipe.youtube_url?.trim() ?? "";
  const videoDuration = formatVideoClock(stats?.durationSeconds ?? 0);

  return {
    id: String(recipe.id),
    username: recipe.category_name ? `@${recipe.category_name}` : "@AsianSpices",
    userAvatar: `https://i.pravatar.cc/100?img=${(index % 50) + 10}`,
    videoUri: source,
    sourceUrl: source || undefined,
    thumbnailUri: recipe.thumbnail_url || getYouTubeThumbnail(recipe.youtube_url),
    title: recipe.title,
    description: recipe.short_description || recipe.title,
    category: recipe.category_name || "Recipes",
    likes: stats?.likes ?? 0,
    comments: stats?.comments ?? 0,
    views: formatCompactCount(stats?.views ?? 0),
    duration: videoDuration || formatDuration(totalMinutes),
    shopCount: 0,
    isUserUpload: false,
  };
}

async function getApiRecipeReels(): Promise<ReelItem[]> {
  try {
    const response = await apiRequest<RecipesResponse>("/api/recipes?limit=20");
    const items = (response.items ?? []).filter((item) =>
      Boolean(extractYouTubeVideoId(item.youtube_url)),
    );

    return items
      .map((item, index) => mapRecipeToReel(item, index))
      .filter((item) => Boolean(item.videoUri));
  } catch {
    return [];
  }
}

export async function enrichReelsWithYouTubeStats(reels: ReelItem[]): Promise<ReelItem[]> {
  const videoIds = [
    ...new Set(
      reels
        .map(
          (reel) =>
            extractYouTubeVideoId(reel.videoUri) ?? extractYouTubeVideoId(reel.sourceUrl),
        )
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  if (videoIds.length === 0) return reels;

  const stats = await getYouTubeStatsMap(videoIds);

  return reels.map((reel) => {
    const videoId =
      extractYouTubeVideoId(reel.videoUri) ?? extractYouTubeVideoId(reel.sourceUrl);
    const reelStats = videoId ? stats[videoId] : undefined;
    if (!reelStats) return reel;

    const videoDuration = formatVideoClock(reelStats.durationSeconds ?? 0);
    return {
      ...reel,
      likes: reelStats.likes,
      comments: reelStats.comments,
      views: formatCompactCount(reelStats.views),
      duration: videoDuration || reel.duration,
    };
  });
}

async function getUserReels(): Promise<ReelItem[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ReelItem[];
  } catch {
    return [];
  }
}

async function saveUserReels(reels: ReelItem[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reels));
}

/** Replace with PostgreSQL/API when backend is ready. */
export async function getReels(): Promise<ReelItem[]> {
  const userReels = await getUserReels();
  const validUserReels = userReels.filter((reel) => Boolean(reel.videoUri));
  const apiReels = await getApiRecipeReels();

  if (apiReels.length > 0) {
    return [...validUserReels, ...apiReels];
  }

  return [...validUserReels, ...defaultReels];
}

export async function getReelById(id: string): Promise<ReelItem | null> {
  const reels = await getReels();
  return reels.find((reel) => reel.id === id) ?? null;
}

type CreateRecipeResponse = {
  success?: boolean;
  id?: string;
  error?: string;
};

type RecipeTagsResponse = {
  success?: boolean;
  items?: RecipeTag[];
};

export async function uploadReel(input: UploadReelInput): Promise<ReelItem> {
  const response = await apiRequestWithSessionRetry<CreateRecipeResponse>(
    "/api/account/recipes",
    {
      method: "POST",
      body: {
        title: input.title,
        slug: input.slug,
        short_description: input.shortDescription,
        thumbnail_url: input.thumbnailUrl,
        youtube_url: input.youtubeUrl,
        content: input.content,
        tag_ids: input.tagIds,
      },
    },
  );

  if (!response.success || !response.id) {
    throw new Error(response.error || "Failed to create recipe.");
  }

  const newReel: ReelItem = {
    id: String(response.id),
    username: "@You",
    userAvatar: "https://i.pravatar.cc/100?img=68",
    videoUri: input.youtubeUrl,
    sourceUrl: input.youtubeUrl,
    thumbnailUri: input.thumbnailUrl || getYouTubeThumbnail(input.youtubeUrl),
    title: input.title,
    description: input.shortDescription || input.title,
    category: "Recipes",
    likes: 0,
    comments: 0,
    views: "0",
    duration: "0:00",
    shopCount: 0,
    isUserUpload: true,
  };

  const userReels = await getUserReels();
  await saveUserReels([newReel, ...userReels]);
  return newReel;
}

export async function getRecipeTags(): Promise<RecipeTag[]> {
  try {
    const response = await apiRequest<RecipeTagsResponse>("/api/recipe-tags");
    return response.items ?? [];
  } catch {
    return [];
  }
}
