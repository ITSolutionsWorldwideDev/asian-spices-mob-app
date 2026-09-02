import { webAuthOptions } from "@/core/auth";
import { pool } from "@/core/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getServerSession(webAuthOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orderId = req.nextUrl.searchParams.get("orderId");
  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }

  try {
    const { rows } = await pool.query(
      `
      SELECT
        o.id,
        o.order_number,
        o.tracking_number
      FROM store_orders o
      LEFT JOIN store_customers c ON c.id = o.customer_id
      WHERE o.id = $1 AND c.user_id = $2
      LIMIT 1
      `,
      [orderId, session.user.id]
    );

    if (!rows.length) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      orderId: rows[0].id,
      orderNumber: rows[0].order_number,
      trackingNumber: rows[0].tracking_number ?? null,
    });
  } catch (error) {
    console.error("Order tracking fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
