// app/api/account/change-password/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { webAuthOptions } from "@/core/auth";
import { pool } from "@/core/db";
import bcrypt from "bcryptjs";
import { passwordSchema } from "@/lib/validation/account";

export async function POST(req: NextRequest) {
  const session = await getServerSession(webAuthOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = passwordSchema.safeParse(body);

  if (!parsed.success) {
    const { fieldErrors, formErrors } = parsed.error.flatten();
    const message =
      formErrors[0] ||
      Object.values(fieldErrors).flat()[0] ||
      "Invalid password details";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { currentPassword, newPassword } = parsed.data;
  const client = await pool.connect();

  try {
    const { rows } = await client.query(
      `SELECT password_hash FROM users WHERE id = $1`,
      [session.user.id],
    );

    const valid = await bcrypt.compare(
      currentPassword,
      rows[0].password_hash,
    );

    if (!valid) {
      return NextResponse.json(
        { error: "Invalid current password" },
        { status: 400 },
      );
    }

    const sameAsCurrent = await bcrypt.compare(newPassword, rows[0].password_hash);
    if (sameAsCurrent) {
      return NextResponse.json(
        { error: "New password must be different from your current password" },
        { status: 400 },
      );
    }

    const hash = await bcrypt.hash(newPassword, 10);

    await client.query(
      `UPDATE users SET password_hash = $1 WHERE id = $2`,
      [hash, session.user.id],
    );

    return NextResponse.json({ success: true });
  } finally {
    client.release();
  }
}
