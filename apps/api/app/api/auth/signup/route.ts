// app/api/auth/signup/route.ts

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { runQuery } from "@/core/db";

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

    // check existing user
    const existing = await runQuery(`SELECT id FROM users WHERE email = $1`, [
      email,
    ]);

    if ((existing?.rowCount ?? 0) > 0) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 },
      );
    }

    const hash = await bcrypt.hash(password, 10);

    const result = await runQuery(
      `INSERT INTO users (email, password_hash, name)
       VALUES ($1,$2,$3)
       RETURNING id, email, name, is_platform_admin`,
      [email, hash, name || null],
    );

    const createdUser = result.rows[0];
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

    return NextResponse.json({
      success: true,
      token,
      user: createdUser,
    });
  } catch (err) {
    console.error("SIGNUP ERROR:", err);

    return NextResponse.json({ error: "Signup failed" }, { status: 500 });
  }
}
