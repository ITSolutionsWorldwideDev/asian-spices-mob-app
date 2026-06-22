export type ReelItem = {
  id: string;
  username: string;
  userAvatar: string;
  videoUri: string;
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

export type UploadReelInput = {
  videoUri: string;
  thumbnailUri: string;
  title: string;
  description: string;
  category: string;
};
