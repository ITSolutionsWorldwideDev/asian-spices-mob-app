import type { PoolClient } from "pg";
import { pool } from "@/core/db";
import { sendExpoPushToUser } from "@/core/push";

export type NotificationPreferenceFlag =
  | "order_updates"
  | "recipe_reel_updates"
  | "new_products"
  | "price_drops"
  | "restock_alerts"
  | "promotional_emails";

export type CreateNotificationInput = {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  preferenceFlag?: NotificationPreferenceFlag;
};

let tableEnsured = false;

export async function ensureUserNotificationsTable() {
  if (tableEnsured) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      is_read BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_user_notifications_user_created
      ON user_notifications (user_id, created_at DESC)
  `);

  tableEnsured = true;
}

async function isPreferenceEnabled(
  client: PoolClient | typeof pool,
  userId: string,
  flag: NotificationPreferenceFlag,
): Promise<boolean> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_notification_preferences (
      user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      push_enabled BOOLEAN NOT NULL DEFAULT true,
      order_updates BOOLEAN NOT NULL DEFAULT true,
      recipe_reel_updates BOOLEAN NOT NULL DEFAULT true,
      new_products BOOLEAN NOT NULL DEFAULT true,
      price_drops BOOLEAN NOT NULL DEFAULT true,
      restock_alerts BOOLEAN NOT NULL DEFAULT true,
      promotional_emails BOOLEAN NOT NULL DEFAULT false,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const { rows } = await client.query(
    `
      SELECT
        push_enabled,
        order_updates,
        recipe_reel_updates,
        new_products,
        price_drops,
        restock_alerts,
        promotional_emails
      FROM user_notification_preferences
      WHERE user_id = $1
    `,
    [userId],
  );

  if (!rows.length) {
    return flag !== "promotional_emails";
  }

  const prefs = rows[0] as Record<string, boolean>;
  return Boolean(prefs[flag]);
}

export async function createUserNotification(
  input: CreateNotificationInput,
  existingClient?: PoolClient,
): Promise<{ id: string } | null> {
  await ensureUserNotificationsTable();

  const client = existingClient ?? (await pool.connect());
  const shouldRelease = !existingClient;

  try {
    if (input.preferenceFlag) {
      const allowed = await isPreferenceEnabled(
        client,
        input.userId,
        input.preferenceFlag,
      );
      if (!allowed) return null;
    }

    const { rows } = await client.query<{ id: string }>(
      `
        INSERT INTO user_notifications (user_id, type, title, body, data)
        VALUES ($1, $2, $3, $4, $5::jsonb)
        RETURNING id
      `,
      [
        input.userId,
        input.type,
        input.title,
        input.body,
        JSON.stringify(input.data ?? {}),
      ],
    );

    const created = rows[0] ?? null;

    if (created) {
      sendExpoPushToUser({
        userId: input.userId,
        title: input.title,
        body: input.body,
        data: {
          notificationId: created.id,
          type: input.type,
          ...(input.data ?? {}),
        },
      }).catch((error) =>
        console.error("[Notification] push send failed", error),
      );
    }

    return created;
  } finally {
    if (shouldRelease) client.release();
  }
}

export async function notifyOrderEvent(params: {
  orderId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  client?: PoolClient;
}): Promise<void> {
  const queryClient = params.client ?? pool;

  const { rows } = await queryClient.query<{
    user_id: string | null;
    order_number: string | null;
  }>(
    `
      SELECT sc.user_id, so.order_number
      FROM store_orders so
      LEFT JOIN store_customers sc ON sc.id = so.customer_id
      WHERE so.id = $1
      LIMIT 1
    `,
    [params.orderId],
  );

  const userId = rows[0]?.user_id;
  if (!userId) return;

  const orderNumber = rows[0]?.order_number;

  await createUserNotification(
    {
      userId,
      type: params.type,
      title: params.title,
      body: params.body,
      data: {
        orderId: params.orderId,
        orderNumber,
        ...(params.data ?? {}),
      },
      preferenceFlag: "order_updates",
    },
    params.client,
  );
}
