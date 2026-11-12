export type ProductReview = {
  id: string;
  author: string;
  rating: number;
  text: string;
};

export type ProductDetailExtras = {
  brand: string;
  weight: string;
  description: string;
  inStock: boolean;
  reviews: ProductReview[];
};

export type ProductDetail = {
  id: string;
  name: string;
  image: string;
  rating: number;
  reviewCount: number;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  discountType?: "percentage" | "fixed";
  discount?: number;
  brand: string;
  weight: string;
  description: string;
  healthBenefits?: string;
  origin?: string;
  category?: string;
  inStock: boolean;
  reviews: ProductReview[];
};
