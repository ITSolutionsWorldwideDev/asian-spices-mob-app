import { NextResponse } from "next/server";
import { subscribeUser } from "@/lib/dbactions/newsletter_subscriber";
import { newsletterSchema } from "@/lib/validation/newsletter";
import { sendNewsletterWelcomeEmail } from "@/core/email-templates";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = newsletterSchema.safeParse(body);

    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message ?? "Invalid email address";

      return NextResponse.json(
        { success: false, message },
        { status: 400 },
      );
    }

    const result = await subscribeUser(parsed.data.email);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    await sendNewsletterWelcomeEmail(parsed.data.email);

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";

    return NextResponse.json(
      { success: false, message },
      { status: 500 },
    );
  }
}
