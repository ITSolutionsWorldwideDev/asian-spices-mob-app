import { pool } from "@/core/db";

type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
};

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

async function isPushEnabled(userId: string): Promise<boolean> {
  const { rows } = await pool.query<{ push_enabled: boolean }>(
    `
      SELECT push_enabled
      FROM user_notification_preferences
      WHERE user_id = $1
    `,
    [userId],
  );

  // Default true when preferences row does not exist yet.
  if (!rows.length) return true;
  return Boolean(rows[0].push_enabled);
}

export async function sendExpoPushToUser(params: {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  try {
    await ensurePushTokensTable();

    if (!(await isPushEnabled(params.userId))) {
      return;
    }

    const { rows } = await pool.query<{ token: string }>(
      `SELECT token FROM user_push_tokens WHERE user_id = $1`,
      [params.userId],
    );

    if (!rows.length) return;

    const messages: ExpoPushMessage[] = rows.map((row) => ({
      to: row.token,
      title: params.title,
      body: params.body,
      data: params.data ?? {},
      sound: "default",
    }));

    // Expo accepts batches of up to 100 messages.
    for (let i = 0; i < messages.length; i += 100) {
      const chunk = messages.slice(i, i + 100);
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chunk),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        console.error(
          "[Expo Push] send failed",
          response.status,
          text.slice(0, 500),
        );
        continue;
      }

      const result = (await response.json().catch(() => null)) as {
        data?: Array<{
          status?: string;
          details?: { error?: string };
          message?: string;
        }>;
      } | null;

      // Prune DeviceNotRegistered tokens.
      const tickets = result?.data ?? [];
      for (let index = 0; index < tickets.length; index += 1) {
        const ticket = tickets[index];
        if (
          ticket?.status === "error" &&
          ticket.details?.error === "DeviceNotRegistered"
        ) {
          const badToken = chunk[index]?.to;
          if (badToken) {
            await pool.query(`DELETE FROM user_push_tokens WHERE token = $1`, [
              badToken,
            ]);
          }
        }
      }
    }
  } catch (error) {
    console.error("[Expo Push] unexpected error", error);
  }
}
