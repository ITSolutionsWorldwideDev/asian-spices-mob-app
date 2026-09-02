// app/api/partner-registration/idin/webhook/route.ts

import { NextResponse } from "next/server";
// import { verifyIDIN } from "@/core/idin";
/* import {
  updateVerificationByReference,
  getVerificationByReference,
  updateTenantById,
} from "@/core/db"; */

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const transactionId = body.id || body.transactionId;
    const ref = body.ref || body.metadata?.ref;

    if (!transactionId) {
      return NextResponse.json(
        { error: "missing transactionId" },
        { status: 400 },
      );
    }

    // const result = await verifyIDIN(transactionId);

    // if (result.status !== "success") {
    //   return NextResponse.json({ status: "ignored" });
    // }
    return NextResponse.json({ status: "ignored" });

    // fallback: get ref from DB if not provided
    /* const verification = ref ? await getVerificationByReference(ref) : null;

    if (verification) {
      await updateVerificationByReference(verification.merchant_reference, {
        status: "verified",
        data: result.data,
      });

      await updateTenantById(verification.tenant_id, {
        idin_verified: true,
      });
    } */

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("webhook error:", err);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
