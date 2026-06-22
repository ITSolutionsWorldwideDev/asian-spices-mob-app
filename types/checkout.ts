export type PaymentMethod = {
  id: string;
  title: string;
  subtitle: string;
  icon: "card-outline" | "cash-outline";
};

export type CheckoutData = {
  paymentMethods: PaymentMethod[];
};
