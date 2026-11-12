export type NotificationType =
  | "order_placed"
  | "order_paid"
  | "order_delivered"
  | "order_shipped"
  | "promotion"
  | "price_drop"
  | "review"
  | "recipe"
  | string;

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timeAgo: string;
  isRead: boolean;
  createdAt?: string;
  data?: Record<string, unknown>;
};

export type NotificationsData = {
  notifications: AppNotification[];
};
