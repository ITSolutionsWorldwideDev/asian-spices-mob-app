import { getCategoryWithSubcategories } from "@/lib/dbactions/categories";
import { NextRequest, NextResponse } from "next/server";

const cleanArray = (arr: string[] = []) =>
  arr.filter((v) => v && v !== "" && v !== "null" && v !== "undefined");

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const subcategoryIds = cleanArray(
    new URL(req.url).searchParams.get("subcategories")?.split(",") || [],
  );

  const result = await getCategoryWithSubcategories(slug, subcategoryIds);

  if (result.error) {
    return NextResponse.json({ error: result.error });
  }

  return NextResponse.json(result);
}
