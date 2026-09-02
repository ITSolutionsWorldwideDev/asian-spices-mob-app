import { webAuthOptions } from "@/core/auth";
import { pool } from "@/core/db";
import { getUserRecipeDiscounts } from "@/lib/recipeDiscounts";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(webAuthOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: true, discounts: [] });
    }

    const discounts = await getUserRecipeDiscounts(pool, session.user.id);
    return NextResponse.json({ success: true, discounts });
  } catch (error) {
    console.error("Recipe discounts fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Could not load recipe discounts." },
      { status: 500 },
    );
  }
}
