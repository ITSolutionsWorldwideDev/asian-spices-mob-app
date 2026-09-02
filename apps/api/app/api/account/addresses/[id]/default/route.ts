// app/api/account/addresses/[id]/default/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { webAuthOptions } from "@/core/auth";
import { pool } from "@/core/db";

export async function POST(_: Request, { params }: any) {
  const session = await getServerSession(webAuthOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // =========================
    // GET CUSTOMER
    // =========================
    const { rows: customerRows } = await client.query(
      `
      SELECT id
      FROM store_customers
      WHERE user_id = $1
      LIMIT 1
      `,
      [session.user.id],
    );

    const customer_id = customerRows[0]?.id;

    if (!customer_id) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );
    }

    // =========================
    // VERIFY ADDRESS
    // =========================
    const { rows: addressRows } = await client.query(
      `
      SELECT id
      FROM store_customer_addresses
      WHERE id = $1
      AND customer_id = $2
      LIMIT 1
      `,
      [id, customer_id],
    );

    if (!addressRows.length) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    // =========================
    // REMOVE OLD DEFAULT
    // =========================

    await client.query(
      `UPDATE store_customer_addresses 
     SET is_default = false WHERE customer_id = (
       SELECT customer_id FROM store_customer_addresses WHERE id = $1
     )`,
      [id],
    );

    await client.query(
      `UPDATE store_customer_addresses SET is_default = true WHERE id = $1`,
      [id],
    );

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
    });
  } catch (err) {
    await client.query("ROLLBACK");

    console.error("SET DEFAULT ADDRESS ERROR:", err);

    return NextResponse.json(
      { error: "Failed to update default address" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(webAuthOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await pool.connect();

  const { id } = await params;

  try {
    await client.query("BEGIN");

    // get customer
    const { rows } = await client.query(
      `SELECT id FROM store_customers WHERE user_id = $1 LIMIT 1`,
      [session.user.id],
    );

    const customer_id = rows[0]?.id;

    // remove existing default
    await client.query(
      `UPDATE store_customer_addresses
       SET is_default = false
       WHERE customer_id = $1`,
      [customer_id],
    );

    // set new default
    await client.query(
      `UPDATE store_customer_addresses
       SET is_default = true
       WHERE id = $1`,
      [id],
    );

    await client.query("COMMIT");

    return NextResponse.json({ success: true });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
