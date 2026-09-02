// api/account/profile/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { webAuthOptions } from "@/core/auth";
import { pool } from "@/core/db";
import { profileSchema } from "@/lib/validation/account";

export async function GET() {
  const session = await getServerSession(webAuthOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await pool.connect();

  try {
    const { rows } = await client.query(
      `SELECT c.first_name,c.last_name,c.phone, u.id, u.email, u.name,
          COALESCE(
              NULLIF(TRIM(CONCAT(c.first_name, ' ', c.last_name)), ''),
              u.name
          ) AS displayname
      FROM users as u 
      LEFT JOIN store_customers c ON c.user_id = u.id
       WHERE u.id = $1`,
      [session.user.id],
    );

    return NextResponse.json({ user: rows[0] });
  } finally {
    client.release();
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(webAuthOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = profileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `UPDATE users 
       SET name = $1 
       WHERE id = $2`,
      [parsed.data.name, session.user.id],
    );

    const firstName = parsed.data.name.split(" ")[0] || "";
    const lastName = parsed.data.name.split(" ").slice(1).join(" ") || "";

    const updateResult = await client.query(
      `UPDATE store_customers 
     SET phone = $1, first_name = $2, last_name = $3
     WHERE user_id = $4`,
      [parsed.data.phone, firstName, lastName, session.user.id],
    );

    if (updateResult.rowCount === 0) {
      await client.query(
        `INSERT INTO store_customers (user_id, phone, first_name, last_name)
       VALUES ($1, $2, $3, $4)`,
        [session.user.id, parsed.data.phone, firstName, lastName],
      );
    }

    await client.query("COMMIT");

    return NextResponse.json({ success: true });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Profile update failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
