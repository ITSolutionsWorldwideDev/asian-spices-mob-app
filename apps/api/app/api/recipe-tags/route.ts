// app/api/recipe-tags/route.ts

import { NextResponse } from "next/server";

import { getRecipeTags } from "@/lib/dbactions/recipes";

export async function GET() {
  try {
    const tags = await getRecipeTags();

    return NextResponse.json({
      success: true,
      items: tags,
    });
  } catch (error) {
    console.error("Failed to load recipe tags:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load recipe tags",
      },
      {
        status: 500,
      },
    );
  }
}