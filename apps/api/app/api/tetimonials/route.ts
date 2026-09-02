import { NextResponse } from "next/server";

import { testimonials } from "@/lib/dbactions/testimionial";

export async function POST(req: Request) {
  try {
    const { email, comment, name, rating, product_id } = await req.json();

    if (
      email == undefined ||
      comment == undefined ||
      name == undefined ||
      rating == undefined ||
      product_id == undefined
    ) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 },
      );
    }

    const result = await testimonials(name, email, comment, rating, product_id);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
