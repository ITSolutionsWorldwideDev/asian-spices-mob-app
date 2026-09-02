import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { webAuthOptions } from "@/core/auth";
import { pool } from "@/core/db";
import { ensureUserNotificationsTable } from "@/core/notifications";

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string | Date;
};

function toRelativeTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (!Number.isFinite(minutes) || minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;

  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

function mapRow(row: NotificationRow) {
  return {
    id: String(row.id),
    type: row.type,
    title: row.title,
    description: row.body,
    timeAgo: toRelativeTime(row.created_at),
    isRead: Boolean(row.is_read),
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : new Date(row.created_at).toISOString(),
    data: row.data ?? {},
  };
}

export async function GET(req: Request) {
  const session = await getServerSession(webAuthOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(
    Math.max(Number(searchParams.get("limit") ?? 50) || 50, 1),
    100,
  );

  const client = await pool.connect();

  try {
    await ensureUserNotificationsTable();

    const { rows } = await client.query<NotificationRow>(
      `
        SELECT id, type, title, body, data, is_read, created_at
        FROM user_notifications
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `,
      [session.user.id, limit],
    );

    const unread = await client.query<{ count: string }>(
      `
        SELECT COUNT(*)::text AS count
        FROM user_notifications
        WHERE user_id = $1 AND is_read = false
      `,
      [session.user.id],
    );

    return NextResponse.json({
      notifications: rows.map(mapRow),
      unreadCount: Number(unread.rows[0]?.count ?? 0),
    });
  } catch (error) {
    console.error("GET /api/account/notifications failed", error);
    return NextResponse.json(
      { error: "Failed to load notifications" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
