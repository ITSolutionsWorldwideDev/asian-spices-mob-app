// core/types/catalog.ts

export type CatalogProduct = {
  product_id: string;
  name: string;
  sku: string;
  category: string;
  brand: string;


  base_price: number;
  store_price?: number;
  effective_price: number;

  quantity?: number;
  status?: number;

  is_overridden: boolean;
  assigned: boolean;
  is_assigned: boolean;
};