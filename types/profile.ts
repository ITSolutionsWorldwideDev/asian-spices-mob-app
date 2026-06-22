export type UserProfile = {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  bio?: string;
};

export type ProfileData = {
  user: UserProfile;
  reviewCount: number;
};
