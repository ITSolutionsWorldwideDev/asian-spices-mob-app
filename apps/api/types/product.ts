// apps/web/types/product.ts

export interface Product {
  id: string;

  name: string;
  slug: string;
  description?: string;

  base_price: number;
  sale_price?: number;
  quantity: number;

  category_id: string;
  subcategory_id?: string;
  brand_id?: string;

  category_slug?: string;

  country_of_origin?: string;

  discount_type?: string;
  discount_value?: number;
  promo_code?: string;

  savings?: number;

  created_at: string;
  updated_at: string;

  // 🔥 UI fields (derived / optional)
  images?: string[];
  highlights?: string[];

  rating?: number;
  reviews?: number;

  unit?: string;
  badge?: string;
  shippingNote?: string;
}