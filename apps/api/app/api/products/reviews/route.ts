import { getAllApprovedReviews, getProductReviews } from "@/lib/dbactions/products";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  const page = Number(searchParams.get("page") || "1");
  const limit = Number(searchParams.get("limit") || "10");

  if (!productId) {
    return NextResponse.json({ error: "productId is required" }, { status: 400 });
  }

  try {
    if (productId === "all") {
      const reviews = await getAllApprovedReviews(page, limit);
      return NextResponse.json({ reviews });
    }

    const result = await getProductReviews(productId, page);
    return NextResponse.json({
      reviews: result.reviews,
      total: result.total,
      average: result.average,
    });
  } catch (error) {
    console.error("REVIEWS API ERROR:", error);
    return NextResponse.json(
      { reviews: [], total: 0, average: 0, error: "Something went wrong" },
      { status: 500 },
    );
  }
}
