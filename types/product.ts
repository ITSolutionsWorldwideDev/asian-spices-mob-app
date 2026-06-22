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
  brand: string;
  weight: string;
  description: string;
  inStock: boolean;
  reviews: ProductReview[];
};
