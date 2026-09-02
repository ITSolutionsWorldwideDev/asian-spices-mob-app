import { webAuthOptions } from "@/core/auth";
import { pool } from "@/core/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type { PoolClient } from "pg";

async function getOrCreateCustomer(client: PoolClient, user: { id: string; email?: string | null }) {
  const existing = await client.query(
    `SELECT id FROM store_customers WHERE user_id = $1 LIMIT 1`,
    [user.id],
  );

  if (existing.rowCount) {
    return existing.rows[0].id as string;
  }

  const created = await client.query(
    `INSERT INTO store_customers (user_id, email) VALUES ($1, $2) RETURNING id`,
    [user.id, user.email ?? null],
  );

  return created.rows[0].id as string;
}

export async function GET() {
  const session = await getServerSession(webAuthOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ success: true, recipeIds: [] });
  }

  const client = await pool.connect();

  try {
    const customerId = await getOrCreateCustomer(client, session.user);
    const { rows } = await client.query(
      `SELECT recipe_id FROM recipe_favorites WHERE customer_id = $1 ORDER BY created_at DESC`,
      [customerId],
    );

    return NextResponse.json({
      success: true,
      recipeIds: rows.map((row) => String(row.recipe_id)),
    });
  } catch (error) {
    console.error("RECIPE FAVORITES GET ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(webAuthOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { recipe_id } = await req.json();
  if (!recipe_id) {
    return NextResponse.json({ error: "recipe_id is required" }, { status: 400 });
  }

  const client = await pool.connect();

  try {
    const customerId = await getOrCreateCustomer(client, session.user);

    const result = await client.query(
      `
      INSERT INTO recipe_favorites (tenant_id, recipe_id, customer_id)
      SELECT
        COALESCE(
          r.tenant_id,
          (SELECT rf.tenant_id FROM recipe_favorites rf WHERE rf.recipe_id = r.id LIMIT 1),
          (SELECT rf.tenant_id FROM recipe_favorites rf LIMIT 1)
        ),
        r.id,
        $2
      FROM recipes r
      WHERE r.id = $1
      ON CONFLICT (recipe_id, customer_id) DO NOTHING
      RETURNING id
      `,
      [recipe_id, customerId],
    );

    if (!result.rowCount) {
      const exists = await client.query(
        `SELECT id FROM recipes WHERE id = $1 LIMIT 1`,
        [recipe_id],
      );
      if (!exists.rowCount) {
        return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("RECIPE FAVORITES POST ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(webAuthOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { recipe_id } = await req.json();
  if (!recipe_id) {
    return NextResponse.json({ error: "recipe_id is required" }, { status: 400 });
  }

  const client = await pool.connect();

  try {
    const customerId = await getOrCreateCustomer(client, session.user);

    await client.query(
      `DELETE FROM recipe_favorites WHERE customer_id = $1 AND recipe_id = $2`,
      [customerId, recipe_id],
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("RECIPE FAVORITES DELETE ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    client.release();
  }
}
