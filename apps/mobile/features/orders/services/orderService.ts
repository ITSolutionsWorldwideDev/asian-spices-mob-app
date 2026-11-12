import { apiRequest } from "@/shared/services/api/httpClient";
import type { CartItem } from "@/features/cart/types/cart";
import type { Order, OrderTimelineStep } from "@/features/orders/types/order";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ORDERS_STORAGE_KEY = "@asian_spices_orders";
const RECENT_ORDER_IDS_STORAGE_KEY = "@asian_spices_recent_order_ids";

type BackendOrderItem = {
  id?: string | null;
  product_id?: string | null;
  title?: string | null;
  name?: string | null;
  price?: number | string | null;
  quantity?: number | string | null;
  image?: string | null;
  status?: string | null;
};

type BackendOrderRow = {
  id: string;
  order_number?: string | null;
  order_status?: string | null;
  payment_status?: string | null;
  shipping_status?: string | null;
  fulfillment_status?: string | null;
  routing_status?: string | null;
  current_store_id?: string | null;
  transaction_id?: string | null;
  tracking_number?: string | null;
  shipping_address_line1?: string | null;
  shipping_address_line2?: string | null;
  shipping_city?: string | null;
  shipping_state?: string | null;
  shipping_postal_code?: string | null;
  shipping_country?: string | null;
  total_amount?: number | string | null;
  created_at?: string | null;
  updated_at?: string | null;
  cart_items?: BackendOrderItem[] | null;
};

type AccountOrdersResponse = {
  orders?: BackendOrderRow[];
};

type GetOrderResponse = {
  success?: boolean;
  order?: BackendOrderRow;
};

type OrderTrackingResponse = {
  trackingNumber?: string | null;
};

function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return 0;
}

function mapBackendStatus(status?: string | null): Order["status"] {
  const normalized = (status || "").toLowerCase();
  if (normalized === "delivered") return "delivered";
  if (normalized === "shipped") return "shipped";
  if (normalized === "confirmed") return "confirmed";
  if (normalized === "cancelled") return "cancelled";
  if (normalized === "partially_cancelled") return "partially_cancelled";
  // pending / partially_confirmed / unknown: order is still being worked on.
  return "processing";
}

function buildDeliveryAddress(row: BackendOrderRow) {
  return [
    row.shipping_address_line1,
    row.shipping_address_line2,
    [row.shipping_city, row.shipping_state, row.shipping_postal_code]
      .filter(Boolean)
      .join(" "),
    row.shipping_country,
  ]
    .filter((part) => Boolean(part && String(part).trim().length > 0))
    .join(", ");
}

function mapBackendOrder(row: BackendOrderRow): Order {
  const items = (row.cart_items ?? [])
    .filter((item) => Boolean(item && (item.title || item.name || item.product_id || item.id)))
    .map((item) => {
      const productId = String(item.id ?? item.product_id ?? "unknown");
      const name = item.title?.trim() || item.name?.trim() || "Product";
      const quantity = Math.max(1, toNumber(item.quantity) || 1);
      const unitPrice = toNumber(item.price);
      const itemStatus = (item.status || "pending").toLowerCase();
      return {
        productId,
        name,
        quantity,
        unitPrice,
        image: item.image ?? undefined,
        status: itemStatus,
      };
    });

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = toNumber(row.total_amount);
  const placedAt = row.created_at || new Date().toISOString();
  const updatedAt = row.updated_at || placedAt;

  const paymentStatusRaw = (row.payment_status || "").toLowerCase();
  const paymentStatus: Order["paymentStatus"] =
    paymentStatusRaw === "paid" ? "paid" : paymentStatusRaw === "failed" ? "failed" : "pending";
  const routingStatusRaw = (row.routing_status || "").toLowerCase();
  const isStoreAssigned =
    Boolean(row.current_store_id) || routingStatusRaw === "assigned" || routingStatusRaw === "split";
  const orderStatusRaw = (row.order_status || "").toLowerCase();
  const isCancelled = orderStatusRaw === "cancelled";
  const status = mapBackendStatus(row.order_status);
  const shippingStatus = row.shipping_status ?? null;
  const fulfillmentStatus = row.fulfillment_status ?? null;

  // Same rule as web OrderCard: only shipping_status / fulfillment_status
  // block cancel — not order_status badges like confirmed/processing.
  const shipping = (shippingStatus || "").toLowerCase();
  const fulfillment = (fulfillmentStatus || "").toLowerCase();
  const isShippedOrLater =
    shipping === "shipped" ||
    shipping === "delivered" ||
    fulfillment === "shipped";
  const canCancel = !isCancelled && !isShippedOrLater;

  return {
    id: row.id,
    orderNumber: row.order_number || row.id,
    status,
    paymentStatus,
    shippingStatus,
    fulfillmentStatus,
    isStoreAssigned,
    isCancelled,
    canCancel,
    placedAt,
    updatedAt,
    itemCount,
    items,
    trackingNumber: row.tracking_number?.trim() || "",
    estimatedDelivery: getEstimatedDelivery(),
    deliveryAddress: buildDeliveryAddress(row) || "Delivery address unavailable",
    total,
  };
}

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

async function getTrackedOrderIds(): Promise<string[]> {
  const stored = await AsyncStorage.getItem(RECENT_ORDER_IDS_STORAGE_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(String).filter(Boolean);
  } catch {
    return [];
  }
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

/**
 * Same progress model as web OrderCard / OrderTimeline:
 * Order Placed → Payment Confirmed → Shipped → Delivered
 * Driven by payment_status + shipping_status / fulfillment_status.
 */
export function getOrderProgressStatus(
  order: Order
): "pending" | "paid" | "failed" | "shipped" | "delivered" | "cancelled" {
  if (order.isCancelled || order.status === "cancelled") return "cancelled";
  if (order.paymentStatus === "failed") return "failed";

  // Same as web OrderCard.getProgressStatus — shipping fields only.
  const shipping = (order.shippingStatus || "").toLowerCase();
  const fulfillment = (order.fulfillmentStatus || "").toLowerCase();

  if (shipping === "delivered") return "delivered";
  if (shipping === "shipped" || fulfillment === "shipped") return "shipped";
  if (order.paymentStatus === "paid") return "paid";
  return "pending";
}

/** Same visibility rule as web Cancel Order button. */
export function canShowCancelOrder(order: Order): boolean {
  if (order.isCancelled || order.status === "cancelled") return false;
  const progress = getOrderProgressStatus(order);
  return progress !== "shipped" && progress !== "delivered";
}

export function getOrderTimeline(order: Order): OrderTimelineStep[] {
  const progress = getOrderProgressStatus(order);

  if (progress === "cancelled") {
    return [
      {
        id: "cancelled",
        title: "Order Cancelled",
        description: "This order was cancelled and will not be processed further.",
        timestamp: "",
        state: "current",
      },
    ];
  }

  if (progress === "failed") {
    return [
      {
        id: "placed",
        title: "Order Placed",
        description: "",
        timestamp: "",
        state: "completed",
      },
      {
        id: "failed",
        title: "Payment Failed",
        description: "Payment failed. You can retry from checkout.",
        timestamp: "",
        state: "current",
      },
    ];
  }

  const placed = new Date(order.placedAt);
  const updated = new Date(order.updatedAt);

  const steps = [
    {
      id: "pending",
      title: "Order Placed",
      description: "Your order has been received",
    },
    {
      id: "paid",
      title: "Payment Confirmed",
      description: "Your payment has been verified",
    },
    {
      id: "shipped",
      title: "Shipped",
      description: "Your order is on the way",
    },
    {
      id: "delivered",
      title: "Delivered",
      description: "Your order has been delivered",
    },
  ] as const;

  const currentIndex =
    progress === "pending"
      ? 0
      : progress === "paid"
        ? 1
        : progress === "shipped"
          ? 2
          : 3;

  return steps.map((step, index) => {
    const state: OrderTimelineStep["state"] =
      index < currentIndex
        ? "completed"
        : index === currentIndex
          ? "current"
          : "upcoming";

    const timestamp =
      index === 0
        ? formatTimelineTimestamp(placed)
        : index === currentIndex
          ? formatTimelineTimestamp(updated)
          : "";

    return { ...step, state, timestamp };
  });
}

/** Replace with PostgreSQL/API fetch when backend is ready. */
export async function getOrders(): Promise<Order[]> {
  try {
    const response = await apiRequest<AccountOrdersResponse>(
      "/api/account/orders?page=1&limit=50"
    );
    const apiOrders = (response.orders ?? []).map(mapBackendOrder);
    await AsyncStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(apiOrders));
    return apiOrders;
  } catch {
    // Fall back to device-tracked real order IDs and then local cache.
  }

  try {
    const trackedIds = await getTrackedOrderIds();
    if (trackedIds.length > 0) {
      const fetched = await Promise.all(
        trackedIds.map(async (orderId) => {
          const res = await apiRequest<GetOrderResponse>(
            `/api/get-order?orderId=${encodeURIComponent(orderId)}`
          );
          return res.success && res.order ? mapBackendOrder(res.order) : null;
        })
      );
      const realOrders = fetched.filter((order): order is Order => Boolean(order));
      if (realOrders.length > 0) {
        await AsyncStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(realOrders));
        return realOrders.sort(
          (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()
        );
      }
    }
  } catch {
    // Fall through to last local cache.
  }

  const stored = await getStoredOrders();
  return stored.sort(
    (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()
  );
}

export async function getOrderById(id: string): Promise<Order | null> {
  try {
    const response = await apiRequest<GetOrderResponse>(
      `/api/get-order?orderId=${encodeURIComponent(id)}`
    );
    if (response.success && response.order) {
      const mapped = mapBackendOrder(response.order);
      try {
        const tracking = await apiRequest<OrderTrackingResponse>(
          `/api/order-tracking?orderId=${encodeURIComponent(id)}`
        );
        return {
          ...mapped,
          trackingNumber: tracking.trackingNumber?.trim() || "",
        };
      } catch {
        // Keep mapped fallback when dedicated tracking route is unavailable.
      }
      return mapped;
    }
  } catch {
    // Fall back below.
  }

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

type PaymentStatus = "paid" | "pending" | "failed" | "unknown";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readOrderPaymentStatus(orderId: string): Promise<PaymentStatus> {
  try {
    const res = await apiRequest<{ payment_status?: string | null }>(
      `/api/order-status?orderId=${encodeURIComponent(orderId)}`
    );
    const status = (res.payment_status || "").toLowerCase();
    if (status === "paid") return "paid";
    if (["failed", "cancelled", "expired"].includes(status)) return "failed";
    if (status === "pending") return "pending";
    return "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Confirms that a payment actually succeeded before the order is treated as placed.
 * Uses the gateway-specific verification endpoints (which also update the order in
 * the database) and falls back to reading the stored order status. Retries a few
 * times because the gateway may take a moment to settle after redirect.
 */
export async function verifyPaymentStatus(options: {
  orderId: string;
  paymentMethod: string | null;
  transactionId?: string | null;
}): Promise<PaymentStatus> {
  const { orderId, paymentMethod, transactionId } = options;
  const method = (paymentMethod || "").toLowerCase();

  const maxAttempts = 4;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (attempt > 0) {
      await sleep(1500);
    }

    try {
      if (method === "paynl") {
        const res = await apiRequest<{
          success?: boolean;
          paymentStatus?: PaymentStatus;
        }>("/api/paynl/check-status", {
          method: "POST",
          body: { orderId },
        });
        if (res.paymentStatus === "paid") return "paid";
        if (res.paymentStatus === "failed") return "failed";
      } else if (method === "paypal") {
        if (transactionId) {
          const res = await apiRequest<{
            success?: boolean;
            status?: string;
            alreadyPaid?: boolean;
          }>("/api/paypal/capture", {
            method: "POST",
            body: { paypalOrderId: transactionId, orderId },
          });
          if (res.alreadyPaid || res.status === "COMPLETED") return "paid";
        }
      }
    } catch {
      // Ignore and fall back to the stored order status below.
    }

    const stored = await readOrderPaymentStatus(orderId);
    if (stored === "paid") return "paid";
    if (stored === "failed") return "failed";
  }

  return "pending";
}

export async function trackRecentOrderId(orderId: string): Promise<void> {
  const clean = orderId.trim();
  if (!clean) return;
  const current = await getTrackedOrderIds();
  const next = [clean, ...current.filter((id) => id !== clean)].slice(0, 50);
  await AsyncStorage.setItem(RECENT_ORDER_IDS_STORAGE_KEY, JSON.stringify(next));
}

/** Same payload as web CancelItemsWorkflow → PRE_SHIPMENT_CANCEL. */
export async function submitOrderCancellation(
  orderId: string,
  payload: {
    reason: string;
    comments: string;
    items: { itemId: string; quantity: number }[];
  }
): Promise<{ success?: boolean; message?: string }> {
  return apiRequest<{ success?: boolean; message?: string }>(
    "/api/account/orders/action",
    {
      method: "POST",
      body: {
        orderId,
        actionType: "PRE_SHIPMENT_CANCEL",
        reason: payload.reason,
        comments: payload.comments,
        items: payload.items,
      },
    }
  );
}

export async function createOrderFromCart(
  items: CartItem[],
  total: number,
  estimatedDelivery: string,
  deliveryAddress: string
): Promise<Order> {
  const now = new Date().toISOString();
  const order: Order = {
    id: `order-${Date.now()}`,
    orderNumber: generateOrderNumber(),
    status: "shipped",
    paymentStatus: "paid",
    isStoreAssigned: true,
    isCancelled: false,
    canCancel: false,
    placedAt: now,
    updatedAt: now,
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
