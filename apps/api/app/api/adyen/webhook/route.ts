// app/api/adyen/webhook/route.ts

import { NextResponse } from "next/server";

// import { updateVerificationByReference, updateTenantById } from "@/core/db";

// import { mapIDINResponse } from "@/core/payments";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const notification = body.notificationItems?.[0]?.NotificationRequestItem;

    if (!notification) {
      return NextResponse.json({ received: true });
    }

    const {
      eventCode,
      success,
      pspReference,
      merchantReference,
      additionalData,
    } = notification;

    console.log("Webhook received:", {
      eventCode,
      success,
      merchantReference,
    });

    // Only handle iDIN result
    if (eventCode === "AUTHORISATION") {
      const isSuccess = success === "true";

      const tenantId = merchantReference.split("-")[1];

      // const identityData = mapIDINResponse(additionalData);

      // await updateVerificationByReference(merchantReference, {
      //   status: isSuccess ? "verified" : "failed",
      //   psp_reference: pspReference,
      //   ...identityData,
      //   raw_response: notification,
      // });

      // await updateTenantById(tenantId, {
      //   idin_verified: isSuccess,
      //   idin_status: isSuccess ? "verified" : "failed",
      // });
    }

    return NextResponse.json({ notificationResponse: "[accepted]" });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { notificationResponse: "[accepted]" },
      { status: 200 },
    );
  }
}

/* if (eventCode === "AUTHORISATION") {
      const isSuccess = success === "true";

      // 🔑 Extract tenantId from reference
      const tenantId = merchantReference.split("-")[1];

      // ✅ Map iDIN response
      const identityData = mapIDINResponse(additionalData);

      // ✅ Update verification record
      // await updateVerification(merchantReference, {
      //   status: isSuccess ? "verified" : "failed",
      //   psp_reference: pspReference,
      //   ...identityData,
      //   raw_response: notification,
      // });

      // ✅ Update tenant
      // await updateTenant(tenantId, {
      //   idin_verified: isSuccess,
      //   idin_status: isSuccess ? "verified" : "failed",
      // });

      console.log("Tenant updated:", tenantId);
    } */
