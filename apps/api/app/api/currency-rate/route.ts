// GET /api/currency-rate?code=EUR

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { error: "Currency code is required" },
      { status: 400 },
    );
  }
  try {
    const result = await pool.query(
      `
      SELECT cr.rate,c.symbol
      FROM currency_rates cr
      JOIN currencies c ON c.id = cr.target_currency_id
      WHERE c.code = $1
      `,
      [code],
    );

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch rate" },
      { status: 500 },
    );
  }
}
