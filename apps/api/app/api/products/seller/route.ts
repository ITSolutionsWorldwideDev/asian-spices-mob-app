import { getProductSeller } from "@/lib/dbactions/products";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const productId = new URL(req.url).searchParams.get("productId");

  if (!productId) {
    return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  }

  try {
    const seller = await getProductSeller(productId);

    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    return NextResponse.json({ seller });
  } catch (error) {
    console.error("Seller API error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
