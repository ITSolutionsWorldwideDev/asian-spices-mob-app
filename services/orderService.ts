import ordersJson from "@/data/orders.json";
import type { CartItem } from "@/types/cart";
import type { Order, OrderTimelineStep, OrdersData } from "@/types/order";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ORDERS_STORAGE_KEY = "@asian_spices_orders";
const sampleData = ordersJson as OrdersData;

export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${year}-${suffix}`;
}

export function generateTrackingNumber(): string {
  return `TRK${Math.floor(1000000000 + Math.random() * 9000000000)}`;
}

export function getEstimatedDelivery(daysFromNow = 5): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function formatOrderDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

async function getStoredOrders(): Promise<Order[]> {
  const stored = await AsyncStorage.getItem(ORDERS_STORAGE_KEY);
  if (!stored) return [];
  return JSON.parse(stored) as Order[];
}

export function formatTimelineTimestamp(date: Date): string {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function addHours(base: Date, hours: number): Date {
  const next = new Date(base);
  next.setHours(next.getHours() + hours);
  return next;
}

function addDays(base: Date, days: number): Date {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

/** Replace with PostgreSQL/API fetch when backend is ready. */
export function getOrderTimeline(order: Order): OrderTimelineStep[] {
  const placed = new Date(order.placedAt);
  const steps: Omit<OrderTimelineStep, "state">[] = [
    {
      id: "placed",
      title: "Order Placed",
      description: "Your order has been confirmed",
      timestamp: formatTimelineTimestamp(placed),
    },
    {
      id: "processing",
      title: "Processing",
      description: "Order is being prepared",
      timestamp: formatTimelineTimestamp(addHours(placed, 4)),
    },
    {
      id: "shipped",
      title: "Shipped",
      description: "Package picked up by carrier",
      timestamp: formatTimelineTimestamp(addDays(placed, 1)),
    },
    {
      id: "in-transit",
      title: "In Transit",
      description: "Package is on the way to you",
      timestamp: formatTimelineTimestamp(addDays(placed, 2)),
    },
    {
      id: "delivered",
      title: "Delivered",
      description: "Package delivered successfully",
      timestamp: formatTimelineTimestamp(addDays(placed, 4)),
    },
  ];

  const currentIndexByStatus: Record<Order["status"], number> = {
    confirmed: 0,
    processing: 1,
    shipped: 3,
    delivered: 4,
  };

  const currentIndex = currentIndexByStatus[order.status];

  return steps.map((step, index) => ({
    ...step,
    state:
      index < currentIndex
        ? "completed"
        : index === currentIndex
          ? "current"
          : "upcoming",
  }));
}

/** Replace with PostgreSQL/API fetch when backend is ready. */
export async function getOrders(): Promise<Order[]> {
  const stored = await getStoredOrders();
  if (stored.length === 0) {
    return sampleData.orders;
  }
  return stored.sort(
    (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()
  );
}

export async function getOrderById(id: string): Promise<Order | null> {
  const orders = await getOrders();
  const order = orders.find((item) => item.id === id);
  if (!order) return null;
  return {
    ...order,
    deliveryAddress:
      order.deliveryAddress ?? "123 Main Street, Apt 4B, New York, NY 10001",
  };
}

export async function saveOrder(order: Order): Promise<void> {
  const stored = await getStoredOrders();
  await AsyncStorage.setItem(
    ORDERS_STORAGE_KEY,
    JSON.stringify([order, ...stored])
  );
}

export async function createOrderFromCart(
  items: CartItem[],
  total: number,
  estimatedDelivery: string,
  deliveryAddress: string
): Promise<Order> {
  const order: Order = {
    id: `order-${Date.now()}`,
    orderNumber: generateOrderNumber(),
    status: "shipped",
    placedAt: new Date().toISOString(),
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    items: items.map((item) => ({
      productId: item.id,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.price,
      image: item.image,
    })),
    trackingNumber: generateTrackingNumber(),
    estimatedDelivery,
    deliveryAddress,
    total,
  };

  await saveOrder(order);
  return order;
}
