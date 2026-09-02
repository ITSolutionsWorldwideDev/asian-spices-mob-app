// app/api/order-status/route.ts

import { pool } from "@/core/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = (searchParams.get("orderId") || "").split(",")[0]?.trim();

  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }

  const result = await pool.query(
    `SELECT payment_status FROM store_orders WHERE id = $1`,
    [orderId]
  );

  if (!result.rows.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(result.rows[0]);
}
