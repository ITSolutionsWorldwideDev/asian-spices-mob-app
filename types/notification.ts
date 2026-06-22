export type NotificationType =
  | "order_delivered"
  | "promotion"
  | "order_shipped"
  | "price_drop"
  | "review"
  | "recipe";

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timeAgo: string;
  isRead: boolean;
};

export type NotificationsData = {
  notifications: AppNotification[];
};
