// app/api/cart/merge/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/core/db";
import { getServerSession } from "next-auth";
import { webAuthOptions } from "@/core/auth";

export async function POST(req: Request) {
  const session = await getServerSession(webAuthOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { items } = await req.json();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    /* ---------------- GET CUSTOMER ---------------- */

    let customerRes = await client.query(
      `SELECT id FROM store_customers WHERE user_id = $1 LIMIT 1`,
      [session.user.id],
    );

    let customerId;

    if (!customerRes.rowCount) {
      const newCustomer = await client.query(
        `INSERT INTO store_customers (user_id)
         VALUES ($1)
         RETURNING id`,
        [session.user.id],
      );

      customerId = newCustomer.rows[0].id;
    } else {
      customerId = customerRes.rows[0].id;
    }

    /* ---------------- GET CART ---------------- */

    let cartRes = await client.query(
      `SELECT id FROM store_carts WHERE global_customer_id = $1`,
      [customerId],
    );

    let cartId;

    if (!cartRes.rowCount) {
      const newCart = await client.query(
        `INSERT INTO store_carts (global_customer_id)
         VALUES ($1)
         RETURNING id`,
        [customerId],
      );

      cartId = newCart.rows[0].id;
    } else {
      cartId = cartRes.rows[0].id;
    }

    /* ---------------- MERGE ITEMS ---------------- */

    for (const item of items) {
      let productRes = await client.query(
        `SELECT base_price FROM store_products WHERE id = $1`,
        [item.id],
      );

      const dbBasePrice = Number(productRes.rows[0]?.base_price ?? 0);
      const parsedClientPrice = Number(item.price);
      const unitPrice =
        Number.isFinite(parsedClientPrice) && parsedClientPrice > 0
          ? parsedClientPrice
          : dbBasePrice;

      await client.query(
        `
        INSERT INTO store_cart_items (cart_id, product_id, quantity, price)
        VALUES ($1,$2,$3,$4)
        ON CONFLICT (cart_id, product_id)
        DO UPDATE SET
          quantity = store_cart_items.quantity + EXCLUDED.quantity,
          price = EXCLUDED.price
        `,
        [cartId, item.id, item.quantity, unitPrice],
      );
    }

    await client.query("COMMIT");

    return NextResponse.json({ success: true });
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
