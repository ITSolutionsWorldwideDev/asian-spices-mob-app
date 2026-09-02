// /api/account/change-email/request/route.ts

import { randomUUID } from "crypto";
import { pool } from "@/core/db";
import { getServerSession } from "next-auth";
import { webAuthOptions } from "@/core/auth";

export async function POST(req: Request) {
  const session = await getServerSession(webAuthOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { newEmail } = await req.json();

  const token = randomUUID();
  const expires = new Date(Date.now() + 1000 * 60 * 60); // 1h

  const client = await pool.connect();

  await client.query(
    `INSERT INTO email_change_tokens (user_id, new_email, token, expires_at)
     VALUES ($1,$2,$3,$4)`,
    [session.user.id, newEmail, token, expires],
  );

  client.release();

  // TODO: send email
  console.log(`VERIFY EMAIL: /verify-email?token=${token}`);

  return Response.json({ success: true });
}