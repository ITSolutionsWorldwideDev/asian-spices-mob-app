import { randomInt } from "crypto";
import { pool } from "@/core/db";
import { sendPasswordResetEmail } from "@/core/email-templates";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const normalizedEmail = String(email ?? "").trim().toLowerCase();

    if (!normalizedEmail) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const client = await pool.connect();

    try {
      const { rows } = await client.query(
        `SELECT id FROM users WHERE email = $1`,
        [normalizedEmail],
      );

      if (!rows.length) {
        return NextResponse.json({ success: true });
      }

      const otp = String(randomInt(100000, 1000000));

      await client.query(`DELETE FROM password_reset_tokens WHERE user_id = $1`, [
        rows[0].id,
      ]);

      await client.query(
        `INSERT INTO password_reset_tokens (user_id, token, expires_at)
         VALUES ($1, $2, now() + interval '1 hour')`,
        [rows[0].id, otp],
      );

      await sendPasswordResetEmail({ email: normalizedEmail, token: otp });

      return NextResponse.json({ success: true });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("[Forgot Password Controller Crash]:", error);
    return NextResponse.json({ error: "Internal System Error" }, { status: 500 });
  }
}