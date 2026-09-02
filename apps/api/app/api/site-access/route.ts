// app/api/site-access/route.ts

import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "site-access";

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (
    body.password ===
    process.env.SITE_ACCESS_PASSWORD
  ) {
    const response = NextResponse.json({
      success: true,
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value:
        process.env.SITE_ACCESS_PASSWORD!,
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  }

  return NextResponse.json(
    { success: false },
    { status: 401 }
  );
}