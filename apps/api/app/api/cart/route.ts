// app/api/cart/route.ts

import { pool } from "@/core/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { webAuthOptions } from "@/core/auth";

// ✅ GET CART
export async function GET() {
  const session = await getServerSession(webAuthOptions);

  if (!session?.user?.id) {
    return NextResponse.json([], { status: 200 });
  }

  const client = await pool.connect();

  try {
    const customerId = await getOrCreateCustomer(client, session.user);
    // console.log('customerId === ',customerId);

    const cartRes = await client.query(
      `SELECT id FROM store_carts WHERE global_customer_id = $1 LIMIT 1`,
      [customerId],
    );

    if (!cartRes.rowCount) return NextResponse.json([]);

    // LEFT JOIN store_product_images pi ON pi.product_id = p.id AND pi.is_primary = true
    // LEFT JOIN media md ON md.media_id = pi.url::int

    const items = await client.query(
      `
        SELECT 
          sci.product_id,
          sci.quantity,
          sci.price::numeric AS unit_price,
          p.name AS title,
          p.category_id,
          p.base_price::numeric AS base_price,
          p.discount_type,
          p.discount_value,
          p.sale_price,
          p.promo_code,
          cat.min_offered_price,
          img.file_url AS image 
        FROM store_cart_items sci
        LEFT JOIN store_products p ON p.id = sci.product_id
        LEFT JOIN (
          SELECT
            spc.product_id,
            MIN(spc.price) AS min_offered_price
          FROM public.store_product_catalog spc
          INNER JOIN public.store_settings ss ON ss.store_id = spc.store_id
          WHERE ss.country_code = 'NL' AND spc.status = 1
          GROUP BY spc.product_id
        ) cat ON cat.product_id = p.id
        LEFT JOIN (
          SELECT DISTINCT ON (pi.product_id) 
            pi.product_id, 
            md.file_url
          FROM store_product_images pi
          LEFT JOIN media md ON md.media_id = pi.url::int
          ORDER BY pi.product_id, pi.is_primary DESC, pi.id ASC
        ) img ON img.product_id = p.id
        WHERE sci.cart_id = $1
      `,
      [cartRes.rows[0].id],
    );

    return NextResponse.json(items.rows);
  } finally {
    client.release();
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(webAuthOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { product_id, quantity, price: clientPrice } = await req.json();
  const client = await pool.connect();

  try {
    const productRes = await client.query(
      `
    SELECT base_price 
    FROM store_products 
    WHERE id = $1
    `,
      [product_id],
    );

    if (!productRes.rowCount) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const dbBasePrice = Number(productRes.rows[0].base_price);
    const parsedClientPrice = Number(clientPrice);
    const unitPrice =
      Number.isFinite(parsedClientPrice) && parsedClientPrice > 0
        ? parsedClientPrice
        : dbBasePrice;
    const customerId = await getOrCreateCustomer(client, session.user);

    let cartRes = await client.query(
      `SELECT id FROM store_carts WHERE global_customer_id = $1 LIMIT 1`,
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

    const result = await client.query(
      `INSERT INTO store_cart_items (cart_id, product_id, quantity, price)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (cart_id, product_id)
       DO UPDATE SET
         quantity = store_cart_items.quantity + EXCLUDED.quantity,
         price = EXCLUDED.price
       RETURNING *`,
      [cartId, product_id, quantity, unitPrice],
    );

    return NextResponse.json(result.rows[0]);
  } finally {
    client.release();
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(webAuthOptions);

  console.log('Empty Cart Operation session?.user?.id === ',session?.user?.id);

  if (!session?.user?.id) {
    return NextResponse.json({}, { status: 401 });
  }

  let product_id: string | undefined;
  try {
    const body = await req.json().catch(() => ({}));
    product_id = body.product_id;
  } catch {
    product_id = undefined;
  }

  console.log('Empty Cart Operation product_id === ',product_id);

  // const { product_id } = await req.json();

  /* ---------------- FIND CUSTOMER ---------------- */

  /* const customerRes = await pool.query(
    `SELECT id FROM store_customers WHERE user_id = $1 LIMIT 1`,
    [session.user.id],
  );

  if (!customerRes.rowCount) {
    return NextResponse.json({ success: true });
  }

  const customerId = customerRes.rows[0].id; */

  /* ---------------- FIND CART ---------------- */

  const client = await pool.connect();

  try {
    const customerId = await getOrCreateCustomer(client, session.user);

    console.log('Empty Cart Operation customerId === ',customerId);

    const cartRes = await client.query(
      `SELECT id FROM store_carts WHERE global_customer_id = $1 LIMIT 1`,
      [customerId],
    );

    console.log('Empty Cart Operation cartRes.rowCount === ',cartRes.rowCount);

    if (!cartRes.rowCount) {
      return NextResponse.json({ success: true });
    }

    const cartId = cartRes.rows[0].id;

    /* ---------------- DELETE ITEM OR CLEAR ALL ---------------- */
    if (product_id) {
      // 1. If a specific product_id is provided, delete only that item
      await client.query(
        `DELETE FROM store_cart_items 
         WHERE cart_id = $1 AND product_id = $2`,
        [cartId, product_id],
      );
    } else {
      // 2. 🚀 If NO product_id is provided, clear the ENTIRE cart (for Checkout Clear)
      await client.query(
        `DELETE FROM store_cart_items 
         WHERE cart_id = $1`,
        [cartId],
      );
    }

    /* ---------------- DELETE ITEM ---------------- */

    // await client.query(
    //   `DELETE FROM store_cart_items
    //  WHERE cart_id = $1 AND product_id = $2`,
    //   [cartId, product_id],
    // );

    return NextResponse.json({ success: true });
  } finally {
    client.release();
  }
}

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
  const email = user.email;

  const existing = await client.query(
    `SELECT id FROM customers WHERE user_id = $1 LIMIT 1`,
    [user.id],
  );

  if (existing.rowCount) {
    return existing.rows[0].id;
  }

  const created = await client.query(
    `INSERT INTO customers (user_id, email)
     VALUES ($1,$2)
     RETURNING id`,
    [user.id, email],
  );

  return created.rows[0].id;
}
 */
