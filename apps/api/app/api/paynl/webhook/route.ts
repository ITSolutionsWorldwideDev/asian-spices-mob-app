// app/api/paynl/webhook/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { assignNextStore } from "@/core/order-routing";
import { sendOrderConfirmationEmail } from "@/core/email-templates";

const PAYNL_API_TOKEN = process.env.PAYNL_API_TOKEN;

async function handlePaynlNotification(req: NextRequest) {
  console.log("🔥 PAYNL WEBHOOK HIT:", req.method);

  let transactionId = "";
  let action = "";
  let reference = "";
  let statusUrl = "";

  // 1️⃣ Extract parameters from either GET (query params) or POST (JSON / form-data)
  if (req.method === "GET") {
    const { searchParams } = new URL(req.url);
    transactionId = searchParams.get("order_id") || searchParams.get("id") || "";
    action = searchParams.get("action") || "";
    reference = searchParams.get("extra1") || searchParams.get("reference") || "";
  } else {
    try {
      const contentType = req.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const body = await req.json();
        transactionId = body.id || body.order_id || "";
        action = body.status?.action?.toLowerCase() || body.action?.toLowerCase() || "";
        reference = body.reference || body.order?.reference || body.extra1 || "";
        statusUrl = body?.links?.status || "";
      } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
        const formData = await req.formData();
        transactionId = (formData.get("order_id") || formData.get("id") || "").toString();
        action = (formData.get("action") || "").toString();
        reference = (formData.get("extra1") || formData.get("reference") || "").toString();
      }
    } catch (parseErr) {
      console.warn("Failed to parse POST body, trying query params fallback:", parseErr);
      const { searchParams } = new URL(req.url);
      transactionId = searchParams.get("order_id") || searchParams.get("id") || "";
      action = searchParams.get("action") || "";
      reference = searchParams.get("extra1") || searchParams.get("reference") || "";
    }
  }

  // If reference is still empty, look up store_orders by transaction_id
  if (!reference && transactionId) {
    try {
      const orderLookup = await pool.query(
        `SELECT id FROM store_orders WHERE transaction_id = $1 LIMIT 1`,
        [transactionId],
      );
      if (orderLookup.rowCount && orderLookup.rowCount > 0) {
        reference = orderLookup.rows[0].id.toString();
      }
    } catch (lookupErr) {
      console.error("Order lookup by transactionId failed:", lookupErr);
    }
  }

  if (!transactionId && !reference) {
    console.error("Missing transactionId and reference in Paynl webhook");
    return new Response("TRUE", { status: 200 });
  }

  // 2️⃣ Verify status with Pay.nl Connect API if token is present
  let verifiedStatus = action.toLowerCase();

  if (transactionId && PAYNL_API_TOKEN) {
    try {
      const verifyRes = await fetch(
        statusUrl || `https://connect.pay.nl/v1/orders/${transactionId}`,
        {
          headers: {
            Authorization: `Bearer ${PAYNL_API_TOKEN}`,
            Accept: "application/json",
          },
        },
      );
      if (verifyRes.ok) {
        const verifyData = await verifyRes.json();
        verifiedStatus = (
          verifyData?.status?.action?.toLowerCase() ||
          verifyData?.status?.toLowerCase() ||
          verifiedStatus
        );
      }
    } catch (verifyErr) {
      console.warn("Paynl API status verification skipped or failed:", verifyErr);
    }
  }

  console.log("Paynl resolved status:", { transactionId, reference, verifiedStatus });

  // 3️⃣ Status Mapping
  let paymentStatus: "pending" | "paid" | "failed" = "pending";
  if (
    verifiedStatus === "paid" ||
    verifiedStatus === "new_ppt" ||
    verifiedStatus === "completed"
  ) {
    paymentStatus = "paid";
  } else if (["failed", "cancelled", "expired", "denied"].includes(verifiedStatus)) {
    paymentStatus = "failed";
  }

  // 4️⃣ Idempotent DB update & dispatch
  if (paymentStatus === "paid" && reference) {
    const client = await pool.connect();
    let confirmedOrderId: string | null = null;

    try {
      await client.query("BEGIN");

      const result: any = await client.query(
        `UPDATE store_orders
         SET payment_status = 'paid',
             transaction_id = COALESCE($1, transaction_id),
             order_status = 'pending',
             updated_at = NOW()
         WHERE id = $2 AND payment_status != 'paid'
         RETURNING id, order_number`,
        [transactionId || null, reference],
      );

      if (result.rowCount && result.rowCount > 0) {
        confirmedOrderId = result.rows[0].id;
        await assignNextStore(client, confirmedOrderId!);
      }

      await client.query("COMMIT");
    } catch (txError) {
      await client.query("ROLLBACK");
      console.error("Paynl DB transaction failed:", txError);
    } finally {
      client.release();
    }

    // Dispatch email outside the DB transaction for maximum serverless reliability
    if (confirmedOrderId) {
      try {
        await sendOrderConfirmationEmail(confirmedOrderId);
      } catch (emailErr) {
        console.error("[Email Trigger Error PayNL Webhook]:", emailErr);
      }
    }
  } else if (paymentStatus === "failed" && reference) {
    try {
      await pool.query(
        `UPDATE store_orders
         SET payment_status = 'failed',
             transaction_id = COALESCE($1, transaction_id),
             updated_at = NOW()
         WHERE id = $2 AND payment_status != 'paid'`,
        [transactionId || null, reference],
      );
    } catch (failTxErr) {
      console.error("Paynl failed status update error:", failTxErr);
    }
  }

  // Pay.nl expects a 200 OK response with "TRUE" to confirm receipt
  return new Response("TRUE", { status: 200 });
}

export async function GET(req: NextRequest) {
  return handlePaynlNotification(req);
}

export async function POST(req: NextRequest) {
  return handlePaynlNotification(req);
}

