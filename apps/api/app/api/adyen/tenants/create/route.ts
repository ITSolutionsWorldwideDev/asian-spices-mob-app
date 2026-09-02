// app/api/adyen/tenants/create/route.ts

import { NextResponse } from "next/server";
import { runQuery } from "@/core/db";
import { buildInsertQuery } from "@/core/db";

export async function POST(req: Request) {
  const body = await req.json();

  const { text, values } = buildInsertQuery("tenants", {
    name: body.name,
    email: body.email,
    idin_verified: false,
    idin_status: "pending",
  });

  const result = await runQuery(text, values);

  return NextResponse.json(result.rows[0]);
}