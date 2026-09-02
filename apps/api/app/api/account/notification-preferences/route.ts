import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { webAuthOptions } from "@/core/auth";
import { pool } from "@/core/db";
import { notificationPreferencesSchema } from "@/lib/validation/account";

const DEFAULTS = {
  pushEnabled: true,
  orderUpdates: true,
  recipeReelUpdates: true,
  newProducts: true,
  priceDrops: true,
  restockAlerts: true,
  promotionalEmails: false,
};

type PreferenceRow = {
  push_enabled: boolean;
  order_updates: boolean;
  recipe_reel_updates: boolean;
  new_products: boolean;
  price_drops: boolean;
  restock_alerts: boolean;
  promotional_emails: boolean;
};

function toApi(row: PreferenceRow | undefined) {
  if (!row) return { ...DEFAULTS };

  return {
    pushEnabled: Boolean(row.push_enabled),
    orderUpdates: Boolean(row.order_updates),
    recipeReelUpdates: Boolean(row.recipe_reel_updates),
    newProducts: Boolean(row.new_products),
    priceDrops: Boolean(row.price_drops),
    restockAlerts: Boolean(row.restock_alerts),
    promotionalEmails: Boolean(row.promotional_emails),
  };
}

async function ensureTable() {
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
}

export async function GET() {
  const session = await getServerSession(webAuthOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await pool.connect();

  try {
    await ensureTable();

    const { rows } = await client.query<PreferenceRow>(
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
      [session.user.id],
    );

    if (!rows.length) {
      await client.query(
        `
          INSERT INTO user_notification_preferences (user_id)
          VALUES ($1)
          ON CONFLICT (user_id) DO NOTHING
        `,
        [session.user.id],
      );
      return NextResponse.json({ preferences: { ...DEFAULTS } });
    }

    return NextResponse.json({ preferences: toApi(rows[0]) });
  } catch (error) {
    console.error("GET /api/account/notification-preferences failed", error);
    return NextResponse.json(
      { error: "Failed to load notification preferences" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(webAuthOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = notificationPreferencesSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const prefs = { ...parsed.data };
  if (!prefs.pushEnabled) {
    prefs.orderUpdates = false;
    prefs.recipeReelUpdates = false;
    prefs.newProducts = false;
    prefs.priceDrops = false;
    prefs.restockAlerts = false;
  }

  const client = await pool.connect();

  try {
    await ensureTable();

    const { rows } = await client.query<PreferenceRow>(
      `
        INSERT INTO user_notification_preferences (
          user_id,
          push_enabled,
          order_updates,
          recipe_reel_updates,
          new_products,
          price_drops,
          restock_alerts,
          promotional_emails,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
        ON CONFLICT (user_id) DO UPDATE SET
          push_enabled = EXCLUDED.push_enabled,
          order_updates = EXCLUDED.order_updates,
          recipe_reel_updates = EXCLUDED.recipe_reel_updates,
          new_products = EXCLUDED.new_products,
          price_drops = EXCLUDED.price_drops,
          restock_alerts = EXCLUDED.restock_alerts,
          promotional_emails = EXCLUDED.promotional_emails,
          updated_at = now()
        RETURNING
          push_enabled,
          order_updates,
          recipe_reel_updates,
          new_products,
          price_drops,
          restock_alerts,
          promotional_emails
      `,
      [
        session.user.id,
        prefs.pushEnabled,
        prefs.orderUpdates,
        prefs.recipeReelUpdates,
        prefs.newProducts,
        prefs.priceDrops,
        prefs.restockAlerts,
        prefs.promotionalEmails,
      ],
    );

    return NextResponse.json({
      success: true,
      preferences: toApi(rows[0]),
    });
  } catch (error) {
    console.error("PUT /api/account/notification-preferences failed", error);
    return NextResponse.json(
      { error: "Failed to save notification preferences" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
