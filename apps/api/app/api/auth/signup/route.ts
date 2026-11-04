// app/api/auth/signup/route.ts

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { runQuery } from "@/core/db";
import { sendAccountWelcomeEmail } from "@/core/email-templates";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // check existing user
    const existing = await runQuery(`SELECT id FROM users WHERE LOWER(email) = $1`, [
      normalizedEmail,
    ]);

    if ((existing?.rowCount ?? 0) > 0) {
      return NextResponse.json(
        { error: "User already exists with this email" },
        { status: 400 },
      );
    }

    const hash = await bcrypt.hash(password, 10);

    let createdUser;
    try {
      const result = await runQuery(
        `INSERT INTO users (email, password_hash, name, status)
         VALUES ($1, $2, $3, 'active')
         RETURNING id, email, name, is_platform_admin`,
        [normalizedEmail, hash, name ? name.trim() : null],
      );
      createdUser = result.rows[0];
    } catch {
      // Fallback in case status or is_platform_admin columns are named differently
      const result = await runQuery(
        `INSERT INTO users (email, password_hash, name)
         VALUES ($1, $2, $3)
         RETURNING id, email, name`,
        [normalizedEmail, hash, name ? name.trim() : null],
      );
      createdUser = result.rows[0];
    }

    const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
    const token =
      secret && createdUser
        ? jwt.sign(
            {
              sub: createdUser.id,
              email: createdUser.email,
              isPlatformAdmin: Boolean(createdUser.is_platform_admin),
              storeRoles: [],
            },
            secret,
            { expiresIn: "7d" },
          )
        : null;

    // Link or create store_customers record
    const trimmedName = name ? name.trim() : "";
    let firstName: string | undefined;
    let lastName: string | undefined;
    if (trimmedName) {
      const parts = trimmedName.split(/\s+/);
      firstName = parts[0];
      if (parts.length > 1) {
        lastName = parts.slice(1).join(" ");
      }
    }

    try {
      const existingCustomer = await runQuery(
        `SELECT id FROM store_customers WHERE LOWER(email) = LOWER($1) LIMIT 1`,
        [normalizedEmail],
      );

      if ((existingCustomer?.rowCount ?? 0) > 0) {
        await runQuery(
          `UPDATE store_customers 
           SET user_id = $1,
               first_name = COALESCE(NULLIF($2, ''), first_name),
               last_name = COALESCE(NULLIF($3, ''), last_name)
           WHERE LOWER(email) = LOWER($4)`,
          [createdUser.id, firstName || null, lastName || null, normalizedEmail],
        );
      } else {
        await runQuery(
          `INSERT INTO store_customers (user_id, first_name, last_name, email)
           VALUES ($1, $2, $3, $4)`,
          [createdUser.id, firstName || null, lastName || null, normalizedEmail],
        );
      }
    } catch (custErr) {
      console.warn("[store_customers link warning]:", custErr);
    }

    // Send welcome email (asynchronous dispatch)
    sendAccountWelcomeEmail({
      email: normalizedEmail,
      name: trimmedName || undefined,
      firstName,
      lastName,
    }).catch((emailErr) => {
      console.error("[Signup Welcome Email Error]:", emailErr);
    });

    return NextResponse.json({
      success: true,
      token,
      user: createdUser,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Signup failed";
    console.error("SIGNUP ERROR:", errorMsg, err);

    return NextResponse.json(
      { error: errorMsg || "Signup failed" },
      { status: 500 },
    );
  }
}
