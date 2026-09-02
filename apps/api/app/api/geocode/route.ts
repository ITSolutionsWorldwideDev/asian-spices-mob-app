// app/api/geocode/route.ts

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 },
      );
    }

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      address,
    )}&format=json&limit=1`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "your-app-name",
      },
    });

    const data = await res.json();

    if (!data.length) {
      return NextResponse.json({ error: "No location found" }, { status: 404 });
    }

    return NextResponse.json({
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      display_name: data[0].display_name,
    });
  } catch (error) {
    console.error("GEOCODE API ERROR:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
