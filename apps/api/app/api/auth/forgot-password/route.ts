import { randomInt } from "crypto";
import { pool } from "@/core/db";
import { sendPasswordResetEmail } from "@/core/email-templates";
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
  try {
    const { email } = await req.json();
    const normalizedEmail = String(email ?? "").trim().toLowerCase();

    if (!normalizedEmail) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    await ensurePasswordResetTokensTable();

    const client = await pool.connect();

    try {
      const { rows } = await client.query(
        `SELECT id, email FROM users WHERE LOWER(TRIM(email)) = $1`,
        [normalizedEmail],
      );

      if (!rows.length) {
        console.warn(
          `[Forgot Password] No user found in 'users' table with email: "${normalizedEmail}". No email dispatched.`,
        );
        // Return success for security (prevents account enumeration)
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

      console.log(
        `[Forgot Password] OTP generated for ${normalizedEmail}. Dispatching reset email via SMTP...`,
      );

      const emailResult = await sendPasswordResetEmail({
        email: normalizedEmail,
        token: otp,
      });

      if (!emailResult?.success) {
        console.error(
          `[Forgot Password] SMTP failed to send reset email to ${normalizedEmail}:`,
          emailResult?.error,
        );
      } else {
        console.log(`[Forgot Password] Reset email successfully delivered to ${normalizedEmail}`);
      }

      return NextResponse.json({ success: true });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("[Forgot Password Controller Crash]:", error);
    return NextResponse.json({ error: "Internal System Error" }, { status: 500 });
  }
}
