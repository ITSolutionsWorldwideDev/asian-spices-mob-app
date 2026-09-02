import { createRecipeReview, getAllRecipeReviews, getRecipeReviews } from "@/lib/dbactions/recipes";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const recipeId = searchParams.get("recipeId");
  const page = Number(searchParams.get("page") || "1");
  const limit = Number(searchParams.get("limit") || "10");

  if (!recipeId) {
    return NextResponse.json({ error: "recipeId is required" }, { status: 400 });
  }

  try {
    if (recipeId === "all") {
      const reviews = await getAllRecipeReviews(page, limit);
      return NextResponse.json({ reviews });
    }

    const result = await getRecipeReviews(recipeId, page);
    return NextResponse.json({
      reviews: result.reviews,
      total: result.total,
      average: result.average,
    });
  } catch (error) {
    console.error("RECIPE REVIEWS API ERROR:", error);
    return NextResponse.json(
      { reviews: [], total: 0, average: 0, error: "Something went wrong" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { recipe_id, name, email, comment, rating } = await req.json();

    if (
      recipe_id == null ||
      name == null ||
      email == null ||
      comment == null ||
      rating == null
    ) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 },
      );
    }

    const review = await createRecipeReview(recipe_id, name, email, comment, rating);

    return NextResponse.json({ success: true, data: review });
  } catch (error) {
    console.error("RECIPE REVIEWS POST ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to submit review",
      },
      { status: 500 },
    );
  }
}
