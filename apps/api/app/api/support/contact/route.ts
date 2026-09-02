import { sendSupportContactEmail } from "@/core/email-templates";
import { NextResponse } from "next/server";
import { z } from "zod";

const contactSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  email: z.string().trim().email("Valid email is required"),
  subject: z.string().trim().min(1, "Subject is required"),
  message: z.string().trim().min(1, "Message is required"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message ?? "Invalid support message payload";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const result = await sendSupportContactEmail(parsed.data);

    if (!result.success) {
      return NextResponse.json(
        { error: "Unable to send your message. Please try again later." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Support Contact Route Error]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
