// app/api/partner-registration/idin/callback/route.ts

export const dynamic = "force-dynamic";

// import { verifyIDIN } from "@/core/idin";
// import {
//   updateVerificationByReference,
//   getVerificationByReference,
//   updateTenantById,
// } from "@/core/db";

import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const ref = searchParams.get("ref");
    const transactionId = searchParams.get("id");

    if (!ref && !transactionId) {
      return NextResponse.redirect(
        new URL("/partner-registration/idin/failed", req.url),
      );
    }

    /* let verification = ref ? await getVerificationByReference(ref) : null;

    console.log('verification process completed === ',verification);

    if (!verification) {
      return NextResponse.redirect(
        new URL("/partner-registration/idin/failed", req.url),
      );
    }

    // verify via Mollie
    const result = await verifyIDIN(
      transactionId || verification.merchant_reference,
    );

    console.log('verify via Mollie result === ',result);

    if (result.status === "success") {
      await updateVerificationByReference(ref!, {
        status: "verified",
        data: result.data,
      });

      await updateTenantById(verification.tenant_id, {
        idin_verified: true,
      });

      return NextResponse.redirect(
        new URL(`/partner-registration/success?ref=${ref}`, req.url),
      );
    } */

    return NextResponse.redirect(
      new URL("/partner-registration/idin/failed", req.url),
    );
  } catch (err) {
    console.error(err);
    return NextResponse.redirect(
      new URL("/partner-registration/idin/failed", req.url),
    );
  }
}
