// /api/account/addresses/default/route.ts

import { getServerSession } from "next-auth";
import { webAuthOptions } from "@/core/auth";
import { pool } from "@/core/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(webAuthOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ address: null });
  }

  const client = await pool.connect();

  try {
    const { rows } = await client.query(
      `
      SELECT a.*
      FROM store_customer_addresses a
      JOIN store_customers c ON c.id = a.customer_id
      WHERE c.user_id = $1
      AND a.is_default = true
      LIMIT 1
      `,
      [session.user.id],
    );

    return NextResponse.json({
      address: rows[0] || null,
    });
  } finally {
    client.release();
  }
}