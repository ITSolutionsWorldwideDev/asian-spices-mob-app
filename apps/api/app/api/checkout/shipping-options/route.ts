// 📁 app/api/checkout/shipping-options/route.ts
import { pool } from "@/core/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get("country"); // e.g. "NL"
    const city = searchParams.get("city")?.trim();
    const totalWeight = Number(searchParams.get("weight") || 0);

    if (!country) {
      return NextResponse.json({ success: true, options: [] });
    }

    // Queries active shipping methods matching target location criteria 
    // Priorities exact city matches over generic country fallbacks
    const query = `
      SELECT 
        sm.id AS method_id,
        sm.name AS method_name,
        sm.code AS method_code,
        sr.id AS rate_id,
        sr.price,
        sr.min_delivery_days,
        sr.max_delivery_days
      FROM shipping_rates sr
      JOIN shipping_methods sm ON sr.method_id = sm.id
      WHERE sm.is_active = true
        AND sr.country = $1
        AND (sr.city = $2 OR sr.city IS NULL OR sr.city = '')
        AND ($3 >= sr.min_weight OR sr.min_weight IS NULL)
        AND ($3 <= sr.max_weight OR sr.max_weight IS NULL)
      ORDER BY (CASE WHEN sr.city = $2 THEN 1 ELSE 2 END), sr.price ASC
    `;

    const { rows } = await pool.query(query, [country, city, totalWeight]);

    // De-duplicate if a method returned a city record AND a country record
    const uniqueOptionsMap = new Map();
    rows.forEach((row:any) => {
      if (!uniqueOptionsMap.has(row.method_id)) {
        uniqueOptionsMap.set(row.method_id, {
          id: row.method_id,
          name: row.method_name,
          code: row.method_code,
          price: Number(row.price),
          minDays: row.min_delivery_days,
          maxDays: row.max_delivery_days,
        });
      }
    });

    return NextResponse.json({
      success: true,
      options: Array.from(uniqueOptionsMap.values()),
    });
  } catch (error: any) {
    console.error("Shipping options evaluation error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}