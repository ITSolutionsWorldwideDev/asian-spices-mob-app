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
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const firstFieldError = Object.values(fieldErrors)
      .flat()
      .find((message): message is string => Boolean(message));
    return NextResponse.json(
      {
        error:
          firstFieldError ||
          parsed.error.issues[0]?.message ||
          "Invalid address",
      },
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
      RETURNING id
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

    const firstName = data.first_name?.trim();
    const lastName = data.last_name?.trim();
    const phone = data.phone?.trim();

    if (firstName || lastName || phone) {
      await client.query(
        `
        UPDATE store_customers
        SET
          first_name = COALESCE(NULLIF($1, ''), first_name),
          last_name = COALESCE(NULLIF($2, ''), last_name),
          phone = COALESCE(NULLIF($3, ''), phone)
        WHERE id = $4
        `,
        [firstName || null, lastName || null, phone || null, customer_id],
      );
    }

    await client.query("COMMIT");

    const createdId = rows[0]?.id;
    const { rows: addressRows } = createdId
      ? await client.query(
          `
          SELECT a.*, c.first_name, c.last_name, c.phone
          FROM store_customer_addresses a
          JOIN store_customers c ON c.id = a.customer_id
          WHERE a.id = $1
          LIMIT 1
          `,
          [createdId],
        )
      : { rows: [] };

    return NextResponse.json({
      success: true,
      address: addressRows[0] ?? null,
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
