// app/api/account/orders/route.ts

import { webAuthOptions } from "@/core/auth";
import { pool } from "@/core/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getServerSession(webAuthOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.max(
    1,
    Math.min(50, parseInt(searchParams.get("limit") || "10", 10)),
  );
  const offset = (page - 1) * limit;

  const client = await pool.connect();

  try {
    // Query 1: Fetch total order records count for this user
    const countQuery = `
      SELECT COUNT(DISTINCT o.id) as total
      FROM store_orders o
      LEFT JOIN store_customers c ON c.id = o.customer_id
      WHERE c.user_id = $1
    `;
    const countRes = await client.query(countQuery, [session.user.id]);
    const totalRecords = parseInt(countRes.rows[0]?.total || "0", 10);
    const totalPages = Math.ceil(totalRecords / limit);

    // Query 2: Fetch the paginated dataset slice directly
    const dataQuery = `
      SELECT
        o.*,
        o.tracking_number,
        json_agg(
          json_build_object(
            'id', oi.product_id,
            'title', p.name,
            'price', oi.price,
            'quantity', oi.quantity,
            'image', md.file_url
          )
        ) AS cart_items
      FROM store_orders o
      LEFT JOIN store_order_items oi ON oi.order_id = o.id
      LEFT JOIN store_products p ON oi.product_id = p.id
      LEFT JOIN store_product_images pi 
        ON pi.product_id = p.id AND pi.is_primary = true
      LEFT JOIN media md ON md.media_id = pi.url::int
      LEFT JOIN store_customers c ON c.id = o.customer_id
      WHERE c.user_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const { rows } = await client.query(dataQuery, [
      session.user.id,
      limit,
      offset,
    ]);

    return NextResponse.json({
      orders: rows,
      pagination: {
        page,
        limit,
        totalRecords,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error: any) {
    console.error("Account orders fetch error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
