// /api/auth/reset-password/route.ts

import bcrypt from "bcryptjs";
import { pool } from "@/core/db";
import { NextResponse } from "next/server";

let tableEnsured = false;
async function ensurePasswordResetTokensTable() {
  if (tableEnsured) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        token VARCHAR(50) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token
        ON password_reset_tokens (token)
    `);
    tableEnsured = true;
  } catch (err) {
    console.error("[ensurePasswordResetTokensTable Error]:", err);
  }
}

export async function POST(req: Request) {
  const { token, password } = await req.json();

  if (!token || !password) {
    return NextResponse.json(
      { error: "OTP code and new password are required." },
      { status: 400 },
    );
  }

  await ensurePasswordResetTokensTable();
  const client = await pool.connect();

  try {
    const { rows } = await client.query(
      `SELECT * FROM password_reset_tokens WHERE token = $1 AND expires_at > now()`,
      [String(token).trim()],
    );

    if (!rows.length) {
      return NextResponse.json(
        { error: "Your OTP has expired or is invalid." },
        { status: 400 },
      );
    }

    const record = rows[0];

    const userResult = await client.query(
      `SELECT password_hash FROM users WHERE id = $1`,
      [record.user_id],
    );

    if (!userResult.rows.length) {
      return NextResponse.json({ error: "User not found." }, { status: 400 });
    }

    const sameAsCurrent = await bcrypt.compare(
      password,
      userResult.rows[0].password_hash,
    );

    if (sameAsCurrent) {
      return NextResponse.json(
        { error: "New password must be different from your current password." },
        { status: 400 },
      );
    }

    const hash = await bcrypt.hash(password, 10);

    await client.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [
      hash,
      record.user_id,
    ]);
    await client.query(`DELETE FROM password_reset_tokens WHERE id = $1`, [
      record.id,
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Reset Password Controller Crash]:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    client.release();
  }
}
