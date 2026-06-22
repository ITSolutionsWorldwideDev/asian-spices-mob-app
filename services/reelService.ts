import reelsJson from "@/data/reels.json";
import type { ReelItem, UploadReelInput } from "@/types/reel";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@asian_spices_user_reels";

const defaultReels = reelsJson.reels as ReelItem[];

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
  return [...validUserReels, ...defaultReels];
}

export async function getReelById(id: string): Promise<ReelItem | null> {
  const reels = await getReels();
  return reels.find((reel) => reel.id === id) ?? null;
}

export async function uploadReel(input: UploadReelInput): Promise<ReelItem> {
  const newReel: ReelItem = {
    id: `user-${Date.now()}`,
    username: "@You",
    userAvatar: "https://i.pravatar.cc/100?img=68",
    videoUri: input.videoUri,
    thumbnailUri: input.thumbnailUri,
    title: input.title,
    description: input.description,
    category: input.category,
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

export function getReelCategories(): string[] {
  return [
    "Spices",
    "Spice Blends",
    "Herbs",
    "Beverages",
    "Rice & Grains",
    "Masala Blend",
    "Organic Range",
  ];
}
