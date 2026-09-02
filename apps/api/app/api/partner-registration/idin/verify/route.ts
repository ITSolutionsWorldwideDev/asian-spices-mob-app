// app/api/partner-registration/idin/verify/route.ts

import { NextResponse } from "next/server";

export async function GET() {
  try {
    // ⚠️ Here you verify with provider (webhook or API)

    return NextResponse.json({
      success: true,
      name: "Verified User",
    });
  } catch {
    return NextResponse.json({ success: false });
  }
}