// app/api/account/orders/stats/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { webAuthOptions } from "@/core/auth";
import { pool } from "@/core/db";

export async function GET() {
  const session = await getServerSession(webAuthOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await pool.connect();

  try {
    const statsQuery = `
      SELECT
        COUNT(*) AS total_orders,
        COUNT(*) FILTER (WHERE o.order_status = 'pending') AS pending,
        COUNT(*) FILTER (WHERE o.order_status = 'completed') AS completed,
        COUNT(*) FILTER (WHERE o.order_status = 'confirmed') AS confirmed,
        COUNT(*) FILTER (WHERE o.order_status = 'cancelled') AS cancelled
      FROM store_orders o
      INNER JOIN store_customers c ON c.id = o.customer_id
      WHERE c.user_id = $1
    `;

    const { rows } = await client.query(statsQuery, [session.user.id]);

    return NextResponse.json({
      stats: {
        totalOrders: Number(rows[0].total_orders),
        pending: Number(rows[0].pending),
        completed: Number(rows[0].completed) + Number(rows[0].confirmed),
        confirmed: Number(rows[0].confirmed),
        cancelled: Number(rows[0].cancelled),
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}