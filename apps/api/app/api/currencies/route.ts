import { NextResponse } from "next/server";
import { pool } from "@/core/db";

export async function GET() {
  try {
    const result = await pool.query(
      "SELECT id, name, code, symbol,is_base FROM currencies",
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch currencies" },
      { status: 500 },
    );
  }
}
