import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { authorizeUser } from "@/core/auth/core/authorize";

const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

function signMobileToken(payload: {
  id: string;
  email: string;
  isPlatformAdmin: boolean;
  storeRoles: { store_id: string; role: string; slug: string }[];
}) {
  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET or NEXTAUTH_SECRET is not set");
  }

  return jwt.sign(
    {
      sub: payload.id,
      email: payload.email,
      isPlatformAdmin: payload.isPlatformAdmin,
      storeRoles: payload.storeRoles,
    },
    secret,
    { expiresIn: "7d" },
  );
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const parsed = loginSchema.safeParse(payload);

    if (!parsed.success) {
      const error = parsed.error.issues[0]?.message ?? "Invalid input";
      return NextResponse.json({ error }, { status: 400 });
    }

    const user = await authorizeUser(parsed.data.email, parsed.data.password);
    const token = signMobileToken(user);

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        isPlatformAdmin: user.isPlatformAdmin,
        storeRoles: user.storeRoles,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid credentials") {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    console.error("POST /api/auth/login failed", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
