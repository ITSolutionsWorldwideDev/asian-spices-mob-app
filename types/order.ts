export type OrderStatus = "delivered" | "shipped" | "processing" | "confirmed";

export type OrderLineItem = {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  image?: string;
};

export type OrderTimelineStep = {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  state: "completed" | "current" | "upcoming";
};

export type Order = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  placedAt: string;
  itemCount: number;
  items: OrderLineItem[];
  trackingNumber: string;
  estimatedDelivery: string;
  deliveryAddress: string;
  total: number;
};

export type OrdersData = {
  orders: Order[];
};
