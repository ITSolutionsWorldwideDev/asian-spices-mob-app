// app/api/orders/returns/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { sendReturnStatusUpdateEmail } from "@/core/email-templates";

export async function POST(req: NextRequest) {
  const client = await pool.connect();
  try {
    const body = await req.json();
    const { orderId, reason, items } = body;

    if (!orderId || !reason || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Missing required return details" },
        { status: 400 },
      );
    }

    await client.query("BEGIN");

    // Fetch the customer_id associated with this order matching constraints
    const orderInfoQuery = `SELECT customer_id FROM store_orders WHERE id = $1 LIMIT 1;`;
    const orderInfoRes = await client.query(orderInfoQuery, [orderId]);
    if (orderInfoRes.rows.length === 0) {
      throw new Error("Parent order registry trace not found.");
    }
    const customerId = orderInfoRes.rows[0].customer_id;

    const quantityCheckQuery = `
      SELECT 
        oi.quantity as original_ordered_qty,
        COALESCE(SUM(ri.quantity), 0) as already_returned_qty
      FROM store_order_items oi
      LEFT JOIN store_order_return_items ri ON ri.product_id = oi.product_id
      LEFT JOIN store_order_returns r ON r.id = ri.return_id AND r.status != 'rejected'
      WHERE oi.order_id = $1 AND oi.product_id = $2
      GROUP BY oi.quantity;
    `;

    for (const item of items) {
      const productId = item.productId; // Maps to item.productId based on this route layout context
      const checkRes = await client.query(quantityCheckQuery, [orderId, productId]);

      if (checkRes.rows.length === 0) {
        throw new Error(`The item ${productId} does not exist in the original order.`);
      }

      const { original_ordered_qty, already_returned_qty } = checkRes.rows[0];

      if (parseInt(already_returned_qty, 10) + parseInt(item.quantity, 10) > parseInt(original_ordered_qty, 10)) {
        throw new Error(`Invalid Return Quantity. You have already filed for ${already_returned_qty} out of ${original_ordered_qty} purchased units.`);
      }
    }

    // Generate a unique return reference identifier string
    const uniqueHash = Math.floor(1000 + Math.random() * 9000);
    const returnNumber = `RET-${Date.now().toString().slice(-6)}-${uniqueHash}`;

    // 1. Insert master return record
    const masterRes = await client.query(
      `INSERT INTO store_order_returns (order_id, customer_id, return_number, reason, status) 
       VALUES ($1, $2, $3, $4, 'pending') RETURNING id, return_number`,
      [orderId, customerId, returnNumber, reason],
    );
    const returnId = masterRes.rows[0].id;

    // 2. Insert return items mapping split
    for (const item of items) {
      await client.query(
        `INSERT INTO store_order_return_items (return_id, product_id, quantity) 
         VALUES ($1, $2, $3)`,
        [returnId, item.productId, item.quantity],
      );
    }

    await client.query("COMMIT");

    await sendReturnStatusUpdateEmail(returnId);
    
    return NextResponse.json({
      success: true,
      returnId,
      returnNumber: masterRes.rows[0].return_number,
    });
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("Return insertion transaction failed:", error);
    return NextResponse.json(
      { error: "Internal Database Error" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");

    let query = `
      SELECT r.*, 
             json_agg(json_build_object('product_id', ri.product_id, 'quantity', ri.quantity)) as items
      FROM store_order_returns r
      LEFT JOIN store_order_return_items ri ON r.id = ri.return_id
    `;

    const params = [];
    if (orderId) {
      query += ` WHERE r.order_id = $1`;
      params.push(orderId);
    }

    query += ` GROUP BY r.id ORDER BY r.created_at DESC`;

    const result = await pool.query(query, params);
    return NextResponse.json(result.rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/* export async function POST(req: NextRequest) {
  const client = await pool.connect();
  try {
    const body = await req.json();
    const { orderId, reason, items } = body;

    if (!orderId || !reason || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Missing required return details" },
        { status: 400 },
      );
    }

    await client.query("BEGIN");

    // 1. Insert master return record
    const masterRes = await client.query(
      `INSERT INTO store_order_returns (order_id, reason, status) 
       VALUES ($1, $2, 'pending') RETURNING id`,
      [orderId, reason],
    );
    const returnId = masterRes.rows[0].id;

    // 2. Insert return items mapping split
    for (const item of items) {
      await client.query(
        `INSERT INTO store_order_return_items (return_id, product_id, quantity) 
         VALUES ($1, $2, $3)`,
        [returnId, item.productId, item.quantity],
      );
    }

    await client.query("COMMIT");
    return NextResponse.json({ success: true, returnId });
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("Return insertion transaction failed:", error);
    return NextResponse.json(
      { error: "Internal Database Error" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");

    let query = `
      SELECT r.*, 
             json_agg(json_build_object('product_id', ri.product_id, 'quantity', ri.quantity)) as items
      FROM store_order_returns r
      LEFT JOIN store_order_return_items ri ON r.id = ri.return_id
    `;

    const params = [];
    if (orderId) {
      query += ` WHERE r.order_id = $1`;
      params.push(orderId);
    }

    query += ` GROUP BY r.id ORDER BY r.created_at DESC`;

    const result = await pool.query(query, params);
    return NextResponse.json(result.rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} */
