import { webAuthOptions } from "@/core/auth";
import { pool } from "@/core/db";
import { validateRecipeDiscount } from "@/lib/recipeDiscounts";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(webAuthOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Login required to use recipe discounts." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const discountId = typeof body.discountId === "string" ? body.discountId : "";
    const subtotal = Number(body.subtotal);

    if (!Number.isFinite(subtotal) || subtotal <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid order subtotal." },
        { status: 400 },
      );
    }

    const result = await validateRecipeDiscount(
      pool,
      session.user.id,
      discountId,
      subtotal,
    );

    if (!result.valid) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      id: result.id,
      label: result.label,
      discount: result.discount,
    });
  } catch (error) {
    console.error("Recipe discount validation error:", error);
    return NextResponse.json(
      { success: false, error: "Could not validate recipe discount." },
      { status: 500 },
    );
  }
}
