export type ReelItem = {
  id: string;
  username: string;
  userAvatar: string;
  videoUri: string;
  sourceUrl?: string;
  thumbnailUri: string;
  title: string;
  description: string;
  category: string;
  likes: number;
  comments: number;
  views: string;
  duration: string;
  shopCount?: number;
  isUserUpload?: boolean;
};

export type RecipeTag = {
  id: string;
  name: string;
  slug?: string | null;
  color?: string | null;
};

export type UploadReelInput = {
  title: string;
  slug: string;
  shortDescription: string;
  thumbnailUrl: string;
  youtubeUrl: string;
  content: string;
  tagIds: string[];
};
