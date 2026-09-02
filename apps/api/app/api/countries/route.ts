// app/api/countries/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";

export async function GET(req: NextRequest) {
  try {

    const { searchParams } = new URL(req.url);
    const shippableOnly = searchParams.get("shippable") === "true";

    let query = `
      SELECT 
        country_id AS id, 
        country_name AS name, 
        country_code AS iso2, 
        currency_code,
        is_shippable
      FROM countries
    `;
    
    const values: any[] = [];

    if (shippableOnly) {
      query += ` WHERE is_shippable = true`;
    }

    query += ` ORDER BY country_name ASC`;

    const result = await pool.query(query, values);
console.log(result.rows);
    // const result = await pool.query(
    //   `SELECT country_id as id, country_name as  name, country_code as iso2 FROM countries 
    //    ORDER BY name ASC`,
    // );

    if (!result.rows.length) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(result.rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch countries" },
      { status: 500 },
    );
  }
}
