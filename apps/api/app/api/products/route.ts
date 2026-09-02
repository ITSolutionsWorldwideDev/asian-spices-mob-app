// app/api/products/route.ts

import { getProductById, getProducts, getProductsCount } from "@/lib/dbactions/products";
import { NextRequest, NextResponse } from "next/server";

const cleanArray = (arr: string[] = []) =>
  arr.filter((v) => v && v !== "" && v !== "null" && v !== "undefined");

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("id")?.trim();

  if (productId) {
    try {
      const product = await getProductById(productId);
      return NextResponse.json({ data: product ? [product] : [], total: product ? 1 : 0 });
    } catch (error) {
      console.error("API ERROR:", error);
      return NextResponse.json({ data: [], error: "Something went wrong" }, { status: 500 });
    }
  }

  const subcategories = cleanArray(
    searchParams.get("subcategories")?.split(",") || [],
  );

  const brandIds = cleanArray(searchParams.get("brands")?.split(",") || []);

  const filters = {
    category: searchParams.get("category") || "spices",
    subcategories,
    brands: brandIds,
    minPrice: searchParams.get("min"),
    maxPrice: searchParams.get("max"),
    search: searchParams.get("search"),
    sort: searchParams.get("sort") || "newest",
    page: Number(searchParams.get("page") || "1"),
    saleOnly: searchParams.get("sale_only") === "true",
    limit: Number(searchParams.get("limit") || "20"),
  };

  try {
    const [products, total] = await Promise.all([
      getProducts(filters),
      getProductsCount(filters),
    ]);

    return NextResponse.json({
      data: products,
      total,
    });
  } catch (error) {
    console.error("API ERROR:", error);

    return NextResponse.json(
      { data: [], error: "Something went wrong" },
      { status: 500 },
    );
  }
}
