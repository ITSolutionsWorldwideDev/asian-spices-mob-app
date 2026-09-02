// core/order-routing/index.ts
import { AppError } from "./errors";

/* ================= TYPES ================= */

type StoreCandidate = {
  store_id: string;
  total_price: number;
  latitude: number;
  longitude: number;
  country: string;
};

type StoreWithDistance = StoreCandidate & {
  distance: number;
};

/* ================= CONSTANTS ================= */

export const ORDER_EVENTS = {
  // INITIALIZED: "INITIALIZED",
  CREATED: "created",
  ASSIGNED: "assigned",
  REJECTED: "rejected",
  ACCEPTED: "accepted",
  PARTIAL: "partial",
  DEFAULT_ASSIGNED: "default_assigned",
  ADMIN_REASSIGN: "admin_reassign",
  ADMIN_FORCE_ASSIGN: "admin_force_assign",
  CANCELLED: "cancelled",
} as const;

// ⚠️ move to env later
const DEFAULT_STORE_ID = "afef3fd5-c31a-440a-ae56-99eca0b24359";

/* ================= CORE ================= */

// ✅ FIXED: country comes from SHIPPING ADDRESS (not store)
export const getOrderContext = async (client: any, orderId: string) => {
  const { rows } = await client.query(
    `
    SELECT 
      o.*,
      addr.country,
      addr.latitude,
      addr.longitude
    FROM store_orders o
    JOIN store_customer_addresses addr 
      ON addr.customer_id = o.customer_id
    WHERE o.id = $1
    ORDER BY addr.created_at DESC
    LIMIT 1
  `,
    [orderId],
  );

  if (!rows.length) {
    throw new AppError("Order not found", "ORDER_NOT_FOUND", 404);
  }

  return rows[0];
};

/* ================= STORE CANDIDATES ================= */

export const getCandidateStores = async (
  client: any,
  orderId: string,
  country: string,
): Promise<StoreCandidate[]> => {
  const { rows } = await client.query(
    `
    SELECT 
      spc.store_id,
      SUM(spc.price * oi.quantity) AS total_price,
      sa.latitude,
      sa.longitude,
      sa.country
    FROM store_order_items oi
    JOIN store_product_catalog spc ON spc.product_id = oi.product_id
    JOIN store_addresses sa ON sa.store_id = spc.store_id
    WHERE oi.order_id = $1
      AND spc.status = 1
      AND sa.country = $2
    GROUP BY spc.store_id, sa.latitude, sa.longitude, sa.country
  `,
    [orderId, country],
  );

  return rows;
};

/* ================= DISTANCE ================= */

const getDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/* ================= SORTING ================= */

export const sortStores = (
  stores: StoreCandidate[],
  lat: number,
  lng: number,
): StoreWithDistance[] => {
  return stores
    .map((s) => ({
      ...s,
      total_price: Number(s.total_price),
      latitude: Number(s.latitude),
      longitude: Number(s.longitude),
      distance: getDistance(lat, lng, Number(s.latitude), Number(s.longitude)),
    }))
    .sort((a, b) => {
      // 1️⃣ nearest first
      if (a.distance !== b.distance) {
        return a.distance - b.distance;
      }

      // 2️⃣ cheaper second
      return a.total_price - b.total_price;

      // if (a.total_price !== b.total_price) {
      //   return a.total_price - b.total_price;
      // }
      // return a.distance - b.distance;
    });
};

/* ================= ASSIGN DEFAULT ================= */

export const assignDefaultStore = async (client: any, orderId: string) => {
  console.log("assignDefaultStore DEFAULT_STORE_ID ===== ", DEFAULT_STORE_ID);
  if (!DEFAULT_STORE_ID) {
    throw new AppError(
      "Default store not configured",
      "DEFAULT_STORE_MISSING",
      500,
    );
  }

  await client.query(
    `
    UPDATE store_orders
    SET current_store_id = $1,
        routing_status = 'assigned'
    WHERE id = $2
  `,
    [DEFAULT_STORE_ID, orderId],
  );

  await createAllocations(client, orderId, DEFAULT_STORE_ID);

  await logOrderEvent(client, {
    orderId,
    eventType: ORDER_EVENTS.DEFAULT_ASSIGNED,
    storeId: DEFAULT_STORE_ID,
    message: "Assigned to default store",
  });
};

/* ================= ALLOCATIONS ================= */

const createAllocations = async (
  client: any,
  orderId: string,
  storeId: string,
) => {
  await client.query(
    `
    INSERT INTO order_item_allocations
    (order_id, order_item_id, store_id, allocated_quantity, fulfilled_quantity, status)
    SELECT 
      oi.order_id,
      oi.id,
      $1,
      (oi.quantity - COALESCE(oi.fulfilled_quantity,0)) as remaining,
      0,
      'pending'
    FROM store_order_items oi
    WHERE oi.order_id = $2
      AND (oi.quantity - COALESCE(oi.fulfilled_quantity,0)) > 0

    ON CONFLICT (order_id, order_item_id, store_id)
    DO UPDATE SET
      allocated_quantity = EXCLUDED.allocated_quantity
  `,
    [storeId, orderId],
  );
};

/* ================= ORDER STATUS ================= */

export const resolveOrderStatus = async (client: any, orderId: string) => {
  const { rows } = await client.query(
    `
    SELECT 
      COALESCE(SUM(quantity),0) as total,
      COALESCE(SUM(fulfilled_quantity),0) as fulfilled
    FROM store_order_items
    WHERE order_id = $1
  `,
    [orderId],
  );

  const total = Number(rows[0].total || 0);
  const fulfilled = Number(rows[0].fulfilled || 0);

  let orderStatus = "pending";
  let fulfillmentStatus = "pending";

  if (fulfilled === 0) {
    orderStatus = "pending";
    fulfillmentStatus = "pending";
  } else if (fulfilled < total) {
    orderStatus = "partially_confirmed";
    fulfillmentStatus = "partial";
  } else {
    orderStatus = "confirmed";
    fulfillmentStatus = "fulfilled";
  }

  await client.query(
    `
    UPDATE store_orders
    SET order_status = $1,
        fulfillment_status = $2
    WHERE id = $3
  `,
    [orderStatus, fulfillmentStatus, orderId],
  );
};

/* ================= EVENTS ================= */

export const logOrderEvent = async (
  client: any,
  {
    orderId,
    eventType,
    storeId = null,
    message = "",
    metadata = {},
  }: {
    orderId: string;
    eventType: string;
    storeId?: string | null;
    message?: string;
    metadata?: Record<string, any>;
  },
) => {
  await client.query(
    `
    INSERT INTO order_events
    (order_id, event_type, store_id, message, metadata)
    VALUES ($1,$2,$3,$4,$5)
  `,
    [orderId, eventType, storeId, message, metadata],
  );
};

/* ================= STORE STATUS ================= */

export const isStoreOpenNow = async (client: any, storeId: string) => {
  const now = new Date();
  const day = now.getDay();
  const currentTime = now.toTimeString().slice(0, 5);

  const { rows } = await client.query(
    `
    SELECT open_time, close_time, is_closed
    FROM store_working_hours
    WHERE store_id = $1 AND day_of_week = $2
  `,
    [storeId, day],
  );

  if (!rows.length) return false;

  const wh = rows[0];
  if (wh.is_closed) return false;

  // return currentTime >= wh.open_time && currentTime <= wh.close_time;
  return currentTime >= wh.open_time && currentTime <= wh.close_time;
};

export const isTimeoutExceeded = async (client: any, attempt: any) => {
  const { store_id, created_at } = attempt;

  // get working hours
  const { rows } = await client.query(
    `
    SELECT * FROM store_working_hours
    WHERE store_id = $1
  `,
    [store_id],
  );

  const now = new Date();
  let activeMinutes = 0;

  let cursor = new Date(created_at);

  while (cursor < now) {
    const day = cursor.getDay();

    const hours = rows.find((r: any) => r.day_of_week === day);

    if (!hours || hours.is_closed) {
      cursor.setDate(cursor.getDate() + 1);
      cursor.setHours(0, 0, 0, 0);
      continue;
    }

    const open = new Date(cursor);
    const close = new Date(cursor);

    const [oh, om] = hours.open_time.split(":");
    const [ch, cm] = hours.close_time.split(":");

    open.setHours(+oh, +om, 0);
    close.setHours(+ch, +cm, 0);

    const start = cursor > open ? cursor : open;
    const end = now < close ? now : close;

    if (end > start) {
      activeMinutes += (end.getTime() - start.getTime()) / 60000;
    }

    cursor = new Date(close);
    cursor.setMinutes(cursor.getMinutes() + 1);
  }

  return activeMinutes >= 60;
};

/* ================= MAIN ROUTING ================= */
export const assignNextStore = async (client: any, orderId: string) => {
  const order = await getOrderContext(client, orderId);

  // fallback after 3 rejections
  if ((order.rejection_count || 0) >= 3) {
    return assignDefaultStore(client, orderId);
  }

  // FULL STORE MATCH
  const fullStores = await getStoresThatCanFulfillAllItems(
    client,
    orderId,
    order.shipping_country,
  );
  

  console.log(' assignNextStore fullStores ==== ',fullStores);

  // filter open stores only
  const openStores = [];

  for (const store of fullStores) {
    const isOpen = await isStoreOpenNow(client, store.store_id);

    if (isOpen) {
      openStores.push(store);
    }
  }

  console.log(' assignNextStore openStores ==== ',openStores);

  if (openStores.length > 0) {
    const sorted = sortStores(
      openStores,
      Number(order.shipping_latitude),
      Number(order.shipping_longitude),
    );

    const { rows: attempts } = await client.query(
      `
      SELECT store_id
      FROM order_routing_attempts
      WHERE order_id = $1
    `,
      [orderId],
    );

    const tried = attempts.map((a: any) => a.store_id);

    console.log("assignNextStore tried ===== ", tried);

    const nextStore = sorted.find((s) => !tried.includes(s.store_id));

    console.log("assignNextStore nextStore ===== ", nextStore);

    if (!nextStore) {
      return assignDefaultStore(client, orderId);
    }

    await client.query(
      `
      UPDATE store_orders
      SET current_store_id = $1,
          routing_status = 'assigned'
      WHERE id = $2
    `,
      [nextStore.store_id, orderId],
    );

    await createAllocations(client, orderId, nextStore.store_id);

    await client.query(
      `
      INSERT INTO order_routing_attempts
      (
        order_id,
        store_id,
        attempt_number,
        status
      )
      VALUES ($1,$2,$3,'pending')
    `,
      [orderId, nextStore.store_id, attempts.length + 1],
    );

    await logOrderEvent(client, {
      orderId,
      eventType: ORDER_EVENTS.CREATED,
      storeId: nextStore.store_id,
      message: "Assigned to nearest eligible store",
    });

    return {
      success: true,
      type: "single_store",
      store_id: nextStore.store_id,
    };
  }

  // FALLBACK TO SPLIT
  return assignMultiStore(client, orderId);
};

/* ================= MULTI STORE ================= */

export const assignMultiStore = async (client: any, orderId: string) => {
  const order = await getOrderContext(client, orderId);

  const { rows: orderItems } = await client.query(
    `
    SELECT *
    FROM store_order_items
    WHERE order_id = $1
  `,
    [orderId],
  );

  for (const item of orderItems) {
    const remainingQty = item.quantity - Number(item.fulfilled_quantity || 0);

    if (remainingQty <= 0) {
      continue;
    }

    const { rows: stores } = await client.query(
      `
      SELECT
        spc.store_id,
        spc.quantity,
        spc.price,
        sa.latitude,
        sa.longitude

      FROM store_product_catalog spc

      JOIN store_addresses sa
        ON sa.store_id = spc.store_id

      WHERE spc.product_id = $1
        AND spc.quantity > 0
        AND spc.status = 1
        AND sa.country = $2

      ORDER BY
        spc.price ASC
      `,
      [item.product_id, order.country],
    );

    let remaining = remainingQty;

    for (const store of stores) {
      if (remaining <= 0) {
        break;
      }

      const allocateQty = Math.min(remaining, Number(store.quantity));

      await client.query(
        `
        INSERT INTO order_item_allocations
        (
          order_id,
          order_item_id,
          store_id,
          allocated_quantity,
          fulfilled_quantity,
          status
        )
        VALUES ($1,$2,$3,$4,0,'pending')

        ON CONFLICT (order_id, order_item_id, store_id)
        DO UPDATE SET
          allocated_quantity = EXCLUDED.allocated_quantity
        `,
        [orderId, item.id, store.store_id, allocateQty],
      );

      remaining -= allocateQty;
    }

    // fallback remainder → default store
    if (remaining > 0) {
      await client.query(
        `
        INSERT INTO order_item_allocations
        (
          order_id,
          order_item_id,
          store_id,
          allocated_quantity,
          fulfilled_quantity,
          status
        )
        VALUES ($1,$2,$3,$4,0,'pending')

        ON CONFLICT (order_id, order_item_id, store_id)
        DO UPDATE SET
          allocated_quantity = EXCLUDED.allocated_quantity
        `,
        [orderId, item.id, DEFAULT_STORE_ID, remaining],
      );
    }
  }

  await client.query(
    `
    UPDATE store_orders
    SET routing_status = 'split'
    WHERE id = $1
  `,
    [orderId],
  );

  await logOrderEvent(client, {
    orderId,
    eventType: ORDER_EVENTS.PARTIAL,
    message: "Order split across multiple stores",
  });

  return {
    success: true,
    type: "multi_store",
  };
};

/* ================= FULL FULFILLMENT ================= */

export const getStoresThatCanFulfillAllItems = async (
  client: any,
  orderId: string,
  country: string,
) => {
  const { rows } = await client.query(
    `
    SELECT 
      spc.store_id,
      SUM(spc.price * oi.quantity)::numeric AS total_price,
      sa.latitude,
      sa.longitude,
      sa.country
    FROM store_order_items oi

    JOIN store_product_catalog spc
      ON spc.product_id = oi.product_id

    JOIN store_addresses sa
      ON sa.store_id = spc.store_id

    WHERE oi.order_id = $1
      AND sa.country = $2
      AND spc.status = 1
      AND spc.quantity >= (
        oi.quantity - COALESCE(oi.fulfilled_quantity,0)
      )

    GROUP BY
      spc.store_id,
      sa.latitude,
      sa.longitude,
      sa.country

    HAVING COUNT(DISTINCT oi.product_id) = (
      SELECT COUNT(DISTINCT soi.product_id)
      FROM store_order_items soi
      WHERE soi.order_id = $1
        AND (
          soi.quantity - COALESCE(soi.fulfilled_quantity,0)
        ) > 0
    )
  `,
    [orderId, country],
  );

  return rows;
};

export const getStoresWithPartialItems = async (
  client: any,
  orderId: string,
  country: string,
) => {
  const { rows } = await client.query(
    `
    SELECT 
      spc.store_id,
      oi.product_id,
      oi.quantity,
      spc.price,
      sa.latitude,
      sa.longitude
    FROM store_order_items oi
    JOIN store_product_catalog spc 
      ON spc.product_id = oi.product_id
    JOIN store_addresses sa 
      ON sa.store_id = spc.store_id
    WHERE oi.order_id = $1
      AND spc.status = 1
      AND sa.country = $2
      AND spc.quantity > 0
    `,
    [orderId, country],
  );

  return rows;
};

