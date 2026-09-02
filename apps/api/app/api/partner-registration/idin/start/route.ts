// app/api/partner-registration/idin/start/route.ts

import { NextResponse } from "next/server";
// import { createVerification } from "@/core/db";
// import { startIDIN } from "@/core/idin";

/* export async function POST(req: Request) {
  try {
    const { bank, tenantId } = await req.json();

    if (!bank || !tenantId) {
      return NextResponse.json(
        { error: "Missing bank or tenantId" },
        { status: 400 },
      );
    }
    const merchantReference = `tenant-${tenantId}-${Date.now()}`;

    const verificationRes = await createVerification({
      tenant_id: tenantId,
      provider: "MOLLIE_IDIN",
      status: "pending",
      merchant_reference: merchantReference,
    });

    // console.log('verificationRes === ',verificationRes);
    

    const result = await startIDIN({
      issuer: bank,
      tenantId,
      returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/partner-registration/idin/callback?ref=${merchantReference}&tx=${resultSafeFallback()}`,
    });

    // console.log('startIDIN result === ',result);

    return NextResponse.json({
      redirectUrl: result.redirectUrl,
      transactionId: result.transactionId,
      ref: merchantReference,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
} */

// safe fallback helper
function resultSafeFallback() {
  return Date.now().toString();
}
