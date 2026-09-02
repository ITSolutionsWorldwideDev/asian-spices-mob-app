// app/api/paypal/capture/route.ts

import { NextRequest, NextResponse } from "next/server";
import { sendOrderConfirmationEmail } from "@/core/email-templates";
import { notifyOrderEvent } from "@/core/notifications";
import {
  assignNextStore,
  logOrderEvent,
  ORDER_EVENTS,
} from "@/core/order-routing";
import { pool } from "@/core/db";

const PAYPAL_API =
  process.env.PAYPAL_ENV === "production"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET!;

// Get PayPal access token
async function getAccessToken() {
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error("Failed to get PayPal access token");
  }

  const data = await res.json();
  return data.access_token as string;
}

export async function POST(req: NextRequest) {
  try {
    const { paypalOrderId, orderId } = await req.json();

    if (!paypalOrderId || !orderId) {
      return NextResponse.json(
        { success: false, error: "Missing parameters" },
        { status: 400 },
      );
    }

    // 1️⃣ Check if order already paid (idempotency protection)
    const existing = await pool.query(
      `SELECT payment_status FROM store_orders WHERE id = $1`,
      [orderId],
    );

    if (!existing.rows.length) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 },
      );
    }

    if (existing.rows[0].payment_status === "paid") {
      return NextResponse.json({ success: true, alreadyPaid: true });
    }

    // 2️⃣ Get PayPal token
    const accessToken = await getAccessToken();

    // 3️⃣ Capture payment
    const captureRes = await fetch(
      `${PAYPAL_API}/v2/checkout/orders/${paypalOrderId}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    const captureData = await captureRes.json();

    if (!captureRes.ok) {
      const alreadyCaptured = captureData?.details?.some?.(
        (detail: { issue?: string }) => detail.issue === "ORDER_ALREADY_CAPTURED",
      );

      if (alreadyCaptured) {
        const orderDetailsRes = await fetch(
          `${PAYPAL_API}/v2/checkout/orders/${paypalOrderId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          },
        );

        const orderDetails = await orderDetailsRes.json();

        if (orderDetails?.status === "COMPLETED") {
          await markPayPalOrderPaid(orderId, paypalOrderId);
          return NextResponse.json({
            success: true,
            status: "COMPLETED",
            alreadyPaid: true,
          });
        }
      }

      console.error("PayPal capture error:", captureData);

      return NextResponse.json(
        { success: false, error: captureData },
        { status: 400 },
      );
    }

    // Extract capture info safely
    const captureId =
      captureData?.purchase_units?.[0]?.payments?.captures?.[0]?.id;

    const status = captureData?.status;

    if (status === "COMPLETED") {
      await markPayPalOrderPaid(orderId, paypalOrderId, captureId);
    }

    return NextResponse.json({
      success: true,
      status,
      captureId,
    });
  } catch (err) {
    console.error("PayPal capture API error:", err);

    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}

async function markPayPalOrderPaid(
  orderId: string,
  paypalOrderId: string,
  captureId?: string,
) {
  const client = await pool.connect();
  let shouldSendEmail = false;

  try {
    await client.query("BEGIN");

    const updateResult: any = await client.query(
      `UPDATE store_orders
       SET payment_status = 'paid',
           order_status = 'pending',
           transaction_id = $1,
           updated_at = NOW()
       WHERE id = $2 AND payment_method = 'paypal' AND payment_status != 'paid'
       RETURNING id`,
      [paypalOrderId, orderId],
    );

    if (updateResult?.rowCount > 0) {
      shouldSendEmail = true;

      await logOrderEvent(client, {
        orderId: orderId,
        eventType: ORDER_EVENTS.ASSIGNED,
        message: `PayPal capture successful. Captured Reference ID: ${captureId ?? paypalOrderId}. Order created and routing started`,
        metadata: { captureId: captureId ?? paypalOrderId },
      });

      console.log(`Executing decentralized routing for Order ID: ${orderId}`);
      await assignNextStore(client, orderId);
    }

    await client.query("COMMIT");
  } catch (txError) {
    await client.query("ROLLBACK");
    throw txError;
  } finally {
    client.release();
  }

  if (shouldSendEmail) {
    sendOrderConfirmationEmail(orderId).catch((err) =>
      console.error("[Email Trigger Error Background Execution]:", err),
    );

    notifyOrderEvent({
      orderId,
      type: "order_placed",
      title: "Order Placed",
      body: "Your payment was received and your order has been placed successfully.",
      data: { screen: "track-order" },
    }).catch((err) =>
      console.error("[Notification] PayPal paid failed", err),
    );
  }
}

// if (status === "COMPLETED") {
//   await pool.query(
//     `
//     UPDATE store_orders
//     SET payment_status = 'paid',
//         order_status = 'completed',
//         transaction_id = $1,
//         updated_at = NOW()
//     WHERE id = $2 AND payment_method = 'paypal'
//     `,
//     [paypalOrderId, orderId]
//   );
// }
