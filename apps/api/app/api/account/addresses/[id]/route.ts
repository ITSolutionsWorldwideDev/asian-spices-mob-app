// app/api/account/addresses/[id]/route.ts

import { webAuthOptions } from "@/core/auth";
import { pool } from "@/core/db";
import { addressSchema } from "@/lib/validation/account";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

async function getOwnedAddress(client: any, addressId: string, userId: string) {
  const { rows } = await client.query(
    `
    SELECT a.*, c.first_name, c.last_name, c.phone
    FROM store_customer_addresses a
    INNER JOIN store_customers c
      ON c.id = a.customer_id
    WHERE a.id = $1
      AND c.user_id = $2
    LIMIT 1
    `,
    [addressId, userId],
  );
  return rows[0] ?? null;
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const { id } = await params;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const ownership = await client.query(
      `
      SELECT a.id, a.customer_id
      FROM store_customer_addresses a
      INNER JOIN store_customers c
        ON c.id = a.customer_id
      WHERE a.id = $1
        AND c.user_id = $2
      LIMIT 1
      `,
      [id, session.user.id],
    );

    if (!ownership.rows.length) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    const { data } = parsed;
    const customerId = ownership.rows[0].customer_id;

    await client.query(
      `
      UPDATE store_customer_addresses
      SET
        label = $1,
        address_line1 = $2,
        address_line2 = $3,
        city = $4,
        state = $5,
        postal_code = $6,
        country = $7,
        is_shipping_address = $8,
        is_billing_address = $9,
        updated_at = NOW()
      WHERE id = $10
      `,
      [
        data.label,
        data.address_line1,
        data.address_line2 || null,
        data.city,
        data.state || null,
        data.postal_code,
        data.country,
        data.is_shipping_address,
        data.is_billing_address,
        id,
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
        [firstName || null, lastName || null, phone || null, customerId],
      );
    }

    await client.query("COMMIT");

    const address = await getOwnedAddress(client, id, session.user.id);

    return NextResponse.json({
      success: true,
      address,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("UPDATE ADDRESS ERROR:", err);

    return NextResponse.json(
      { error: "Failed to update address" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}

export async function DELETE(
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
    const { rows } = await client.query(
      `
      SELECT a.id
      FROM store_customer_addresses a
      INNER JOIN store_customers c
        ON c.id = a.customer_id
      WHERE a.id = $1
        AND c.user_id = $2
      LIMIT 1
      `,
      [id, session.user.id],
    );

    if (!rows.length) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    await client.query(`DELETE FROM store_customer_addresses WHERE id = $1`, [
      id,
    ]);

    return NextResponse.json({
      success: true,
    });
  } catch (err) {
    console.error("DELETE ADDRESS ERROR:", err);

    return NextResponse.json(
      { error: "Failed to delete address" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
