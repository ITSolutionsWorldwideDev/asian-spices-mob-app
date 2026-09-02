export type CartItem = {
  id: string;
  name: string;
  image: string;
  weight: string;
  /** VAT-inclusive display price */
  price: number;
  /** Ex-VAT unit price from DB — used to recompute price on app reopen */
  basePrice?: number;
  quantity: number;
};
