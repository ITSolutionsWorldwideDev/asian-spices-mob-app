// app/api/cart/update/route.ts

import { pool } from "@/core/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { webAuthOptions } from "@/core/auth";

export async function PATCH(req: Request) {
  const session = await getServerSession(webAuthOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { product_id, delta } = await req.json();

  if (!product_id || !delta) {
    return NextResponse.json(
      { error: "Missing product_id or delta" },
      { status: 400 },
    );
  }

  const client = await pool.connect();

  try {
    const customerId = await getOrCreateCustomer(client, session.user);

    const cartRes = await client.query(
      `SELECT id FROM store_carts WHERE global_customer_id = $1 LIMIT 1`,
      [customerId],
    );

    if (!cartRes.rowCount) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });
    }

    const cartId = cartRes.rows[0].id;

    // 🔥 Update quantity safely
    const updateRes = await client.query(
      `
      UPDATE store_cart_items
      SET quantity = quantity + $1
      WHERE cart_id = $2 AND product_id = $3
      RETURNING quantity
      `,
      [delta, cartId, product_id],
    );

    // ❗ If item doesn't exist
    if (!updateRes.rowCount) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const newQty = updateRes.rows[0].quantity;

    // 🔥 AUTO DELETE if quantity <= 0
    if (newQty <= 0) {
      await client.query(
        `DELETE FROM store_cart_items WHERE cart_id = $1 AND product_id = $2`,
        [cartId, product_id],
      );
    }

    return NextResponse.json({ success: true, quantity: newQty });
  } finally {
    client.release();
  }
}

/* ---------------- HELPER ---------------- */


async function getOrCreateCustomer(client: any, user: any) {
  const email = user.email;

  // Swapped "customers" out for your ecommerce namespace "store_customers"
  const existing = await client.query(
    `SELECT id FROM store_customers WHERE user_id = $1 LIMIT 1`,
    [user.id],
  );

  if (existing.rowCount) {
    return existing.rows[0].id;
  }

  const created = await client.query(
    `INSERT INTO store_customers (user_id, email)
     VALUES ($1, $2)
     RETURNING id`,
    [user.id, email],
  );

  return created.rows[0].id;
}


/* async function getOrCreateCustomer(client: any, user: any) {
  const existing = await client.query(
    `SELECT id FROM customers WHERE user_id = $1 LIMIT 1`,
    [user.id],
  );

  if (existing.rowCount) {
    return existing.rows[0].id;
  }

  const created = await client.query(
    `INSERT INTO customers (user_id, email)
     VALUES ($1, $2)
     RETURNING id`,
    [user.id, user.email],
  );

  return created.rows[0].id;
} */