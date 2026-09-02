import { pool } from "@/core/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { rows } = await pool.query(
      `SELECT
        c.id,
        c.name,
        c.slug,
        COUNT(p.id)::int AS product_count
       FROM store_categories c
       LEFT JOIN store_products p ON p.category_id = c.id
       WHERE c.status = 1
       GROUP BY c.id, c.name, c.slug
       ORDER BY c.name ASC`,
    );

    return NextResponse.json({ categories: rows });
  } catch (error) {
    console.error("Categories fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
