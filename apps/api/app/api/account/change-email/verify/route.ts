// /api/account/change-email/verify/route.ts

import { pool } from "@/core/db";

export async function POST(req: Request) {
  const { token } = await req.json();
  const client = await pool.connect();

  try {
    const { rows } = await client.query(
      `SELECT * FROM email_change_tokens 
     WHERE token = $1 AND expires_at > now()`,
      [token],
    );

    if (!rows.length) {
      return Response.json({ error: "Invalid token" }, { status: 400 });
    }

    const record = rows[0];

    await client.query(
      `UPDATE users SET email = $1 WHERE id = $2`,
      [record.new_email, record.user_id],
    );

    await client.query(
      `DELETE FROM email_change_tokens WHERE id = $1`,
      [record.id],
    );

    return Response.json({ success: true });
  } finally {
    client.release();
  }
}
