import { validatePromoCode } from "@/lib/promoCodes";
import { pool } from "@/core/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const code = typeof body.code === "string" ? body.code : "";
    const subtotal = Number(body.subtotal);

    if (!Number.isFinite(subtotal) || subtotal <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid order subtotal." },
        { status: 400 },
      );
    }

    const result = await validatePromoCode(pool, code, subtotal);

    if (!result.valid) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      code: result.code,
      discount: result.discount,
    });
  } catch (error) {
    console.error("Promo validation error:", error);
    return NextResponse.json(
      { success: false, error: "Could not validate promo code." },
      { status: 500 },
    );
  }
}
