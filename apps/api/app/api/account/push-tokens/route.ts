import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { webAuthOptions } from "@/core/auth";
import { pool } from "@/core/db";

const registerSchema = z.object({
  token: z.string().min(10, "Push token is required"),
  platform: z.enum(["ios", "android", "web", "unknown"]).optional(),
});

async function ensurePushTokensTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_push_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL,
      platform TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (token)
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user
      ON user_push_tokens (user_id)
  `);
}

export async function POST(req: Request) {
  const session = await getServerSession(webAuthOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const client = await pool.connect();

  try {
    await ensurePushTokensTable();

    await client.query(
      `
        INSERT INTO user_push_tokens (user_id, token, platform, last_seen_at)
        VALUES ($1, $2, $3, now())
        ON CONFLICT (token) DO UPDATE SET
          user_id = EXCLUDED.user_id,
          platform = COALESCE(EXCLUDED.platform, user_push_tokens.platform),
          last_seen_at = now()
      `,
      [
        session.user.id,
        parsed.data.token,
        parsed.data.platform ?? "unknown",
      ],
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/account/push-tokens failed", error);
    return NextResponse.json(
      { error: "Failed to register push token" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(webAuthOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    token?: string;
    all?: boolean;
  };

  const client = await pool.connect();

  try {
    await ensurePushTokensTable();

    if (body.all) {
      await client.query(`DELETE FROM user_push_tokens WHERE user_id = $1`, [
        session.user.id,
      ]);
      return NextResponse.json({ success: true });
    }

    if (!body.token) {
      return NextResponse.json(
        { error: "token is required (or pass all: true)" },
        { status: 400 },
      );
    }

    await client.query(
      `DELETE FROM user_push_tokens WHERE user_id = $1 AND token = $2`,
      [session.user.id, body.token],
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/account/push-tokens failed", error);
    return NextResponse.json(
      { error: "Failed to unregister push token" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
