export type Category = {
  id: string;
  name: string;
  icon: string;
  routeId?: string;
};

export type Reel = {
  id: string;
  title: string;
  chefName: string;
  chefAvatar: string;
  thumbnail: string;
  duration: string;
  views: string;
  likes: string;
};

export type Product = {
  id: string;
  name: string;
  image: string;
  rating: number;
  reviewCount: number;
  price: number;
  originalPrice?: number;
  discount?: number;
  brand?: string;
  isNew?: boolean;
};

export type Recipe = {
  id: string;
  title: string;
  image: string;
  time: string;
  difficulty: string;
  rating: number;
  reviews: number;
  servings: number;
  price: number;
};

export type Hero = {
  title: string;
  subtitle: string;
  promo: string;
  image: string;
};

export type HomeData = {
  hero: Hero;
  categories: Category[];
  reels: Reel[];
  topProducts: Product[];
  newArrivals: Product[];
  herbalProducts: Product[];
  kitchenAppliances: Product[];
  featuredRecipes: Recipe[];
  specialDiscounts: Product[];
};
