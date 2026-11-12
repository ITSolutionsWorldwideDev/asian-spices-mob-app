// app/api/checkout/promo/route.ts
// Aligned with asian-spices-web promo validation response + rules

import { validatePromoCode } from "@/lib/promoCodes";
import { pool } from "@/core/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const subtotal = Number(body.subtotal) || 0;
    const result = await validatePromoCode(pool, String(body.code || ""), subtotal);

    if (!result.valid) {
      return NextResponse.json(
        { valid: false, success: false, error: result.error },
        { status: 400 },
      );
    }

    // Web-shaped fields + mobile-friendly aliases
    return NextResponse.json({
      valid: true,
      success: true,
      code: result.code,
      discount_type: result.discount_type,
      discount_value: result.discount_value,
      discount_amount: result.discount_amount,
      discount: result.discount_amount,
    });
  } catch (error) {
    console.error("[Promo validation error]", error);
    return NextResponse.json(
      {
        valid: false,
        success: false,
        error: "Couldn't validate that code right now.",
      },
      { status: 500 },
    );
  }
}
