// app/api/partner-registration/idin/status/route.ts

import { NextResponse } from "next/server";
import { pool } from "@/core/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json({ error: "missing tenantId" }, { status: 400 });
    }

    // 🔥 read from verification table (source of truth)
    const result = await pool.query(
      `SELECT status 
       FROM verifications 
       WHERE tenant_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [tenantId],
    );

    const record = result.rows[0];

    if (!record) {
      return NextResponse.json({
        status: "pending",
      });
    }

    return NextResponse.json({
      status: record.status, // pending | verified | failed
    });
  } catch (err) {
    console.error("status error:", err);
    return NextResponse.json({ status: "failed" }, { status: 500 });
  }
}
