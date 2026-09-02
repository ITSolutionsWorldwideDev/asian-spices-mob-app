import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { webAuthOptions } from "@/core/auth";
import { pool } from "@/core/db";
import { ensureUserNotificationsTable } from "@/core/notifications";

export async function POST(req: Request) {
  const session = await getServerSession(webAuthOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    id?: string;
    all?: boolean;
  };

  const client = await pool.connect();

  try {
    await ensureUserNotificationsTable();

    if (body.all) {
      await client.query(
        `
          UPDATE user_notifications
          SET is_read = true
          WHERE user_id = $1 AND is_read = false
        `,
        [session.user.id],
      );

      return NextResponse.json({ success: true });
    }

    if (!body.id) {
      return NextResponse.json(
        { error: "id is required (or pass all: true)" },
        { status: 400 },
      );
    }

    const result = await client.query(
      `
        UPDATE user_notifications
        SET is_read = true
        WHERE id = $1 AND user_id = $2
      `,
      [body.id, session.user.id],
    );

    if (!result.rowCount) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/account/notifications/read failed", error);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
