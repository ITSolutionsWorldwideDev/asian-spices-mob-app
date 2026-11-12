export type PaymentMethod = {
  id: string;
  title: string;
  subtitle: string;
  icon: "card-outline" | "cash-outline";
};

export type ShippingOption = {
  id: string;
  name: string;
  code?: string;
  price: number;
  minDays?: number | null;
  maxDays?: number | null;
};

export type CheckoutData = {
  paymentMethods: PaymentMethod[];
};

export type AppliedPromo = {
  code: string;
  discount: number;
};

export type RecipeDiscountOption = {
  id: string;
  recipeId: string;
  recipeTitle: string;
  discountType: string;
  discountValue: number;
};

export type AppliedRecipeDiscount = {
  id: string;
  label: string;
  discount: number;
};
