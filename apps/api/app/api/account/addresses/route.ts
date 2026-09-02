// app/api/account/addresses/route.ts

import { webAuthOptions } from "@/core/auth";
import { pool } from "@/core/db";
import { addressSchema } from "@/lib/validation/account";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(webAuthOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await pool.connect();

  try {
    const { rows } = await client.query(
      `
      SELECT a.*,c.first_name,c.last_name,c.phone
      FROM store_customer_addresses a
      JOIN store_customers c ON c.id = a.customer_id
      WHERE c.user_id = $1
      ORDER BY a.is_default DESC,a.created_at DESC
      `,
      [session.user.id],
    );

    return NextResponse.json({
      success: true,
      addresses: rows,
    });

    // return NextResponse.json({ addresses: rows });
  } catch (err) {
    console.error("GET ADDRESSES ERROR:", err);

    return NextResponse.json(
      { error: "Failed to fetch addresses" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(webAuthOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const parsed = addressSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows: customerRows } = await client.query(
      `SELECT id FROM store_customers WHERE user_id = $1 LIMIT 1`,
      [session.user.id],
    );

    const customer_id = customerRows[0]?.id;

    if (!customer_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data } = parsed;

    // =========================
    // CHECK FIRST ADDRESS
    // =========================
    const { rows: existingAddresses } = await client.query(
      `
      SELECT id
      FROM store_customer_addresses
      WHERE customer_id = $1
      LIMIT 1
      `,
      [customer_id],
    );

    const isFirstAddress = existingAddresses.length === 0;

    // =========================
    // INSERT ADDRESS
    // =========================
    const { rows } = await client.query(
      `
      INSERT INTO store_customer_addresses
      (
        store_id,
        customer_id,
        label,
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        country,
        is_default,
        is_shipping_address,
        is_billing_address
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      `,
      [
        null,
        customer_id,
        data.label,
        data.address_line1,
        data.address_line2 || null,
        data.city,
        data.state || null,
        data.postal_code,
        data.country,

        // first address auto default
        isFirstAddress,

        data.is_shipping_address,
        data.is_billing_address,
      ],
    );

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      address: rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");

    console.error("CREATE ADDRESS ERROR:", err);

    return NextResponse.json(
      { error: "Failed to create address. Please try again." },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
