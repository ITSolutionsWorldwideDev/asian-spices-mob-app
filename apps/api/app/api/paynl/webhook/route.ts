// app/api/paynl/webhook/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { notifyOrderEvent } from "@/core/notifications";
import { assignNextStore } from "@/core/order-routing";

const PAYNL_API_TOKEN = process.env.PAYNL_API_TOKEN;

/**
 * Webhook endpoint for Pay.nl to notify payment status
 */
export async function POST(req: NextRequest) {
  console.log("🔥 WEBHOOK HIT");
  const client = await pool.connect();
  try {
    const body = await req.json();

    console.log("Pay.nl webhook:", body);

    const transactionId = body.id;
    // const status = body.status?.toLowerCase();
    const status = body.status?.action?.toLowerCase();
    const reference = body.reference || body.order?.reference;

    if (!reference) {
      console.error("Missing reference in webhook:", body);
      return NextResponse.json(
        { success: false, error: "Missing order reference" },
        { status: 400 },
      );
    }

    // 🔐 OPTIONAL SAFETY: verify using statusUrl if available
    const statusUrl = body?.links?.status;

    // let verifiedStatus = body?.status?.action?.toLowerCase();
    let verifiedStatus =
      body?.status?.action?.toLowerCase() || body?.status?.toLowerCase();

    if (statusUrl) {
      const verifyRes = await fetch(statusUrl, {
        headers: {
          Authorization: `Bearer ${PAYNL_API_TOKEN}`,
          Accept: "application/json",
        },
      });

      const verifyData = await verifyRes.json();

      verifiedStatus =
        verifyData?.status?.action?.toLowerCase() ||
        verifyData?.status?.toLowerCase();
    }
    console.log("Webhook reference:", reference);
    console.log("Webhook transactionId:", transactionId);
    console.log("Webhook status:", verifiedStatus);

    // =========================
    // STATUS MAPPING
    // =========================
    let paymentStatus: "pending" | "paid" | "failed" = "pending";

    if (verifiedStatus === "paid") {
      paymentStatus = "paid";
    } else if (["failed", "cancelled", "expired"].includes(verifiedStatus)) {
      paymentStatus = "failed";
    }

    // =========================
    // IDEMPOTENT UPDATE
    // =========================

    if (paymentStatus === "paid") {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        const result: any = await client.query(
          ` UPDATE store_orders
            SET payment_status = 'paid',       
                transaction_id = COALESCE($1, transaction_id),
                order_status = 'pending',
                updated_at = NOW()
            WHERE id = $2 AND payment_status != 'paid'
            RETURNING id, order_number`,
          [transactionId, reference], // transaction_id = $1
        );

        if (result.rowCount > 0) {
          const confirmedOrder = result.rows[0];

          // ⚡ INVOKE CORRESPONDING DECENTRALIZED ASSIGNMENT SYSTEM HERE TOO ⚡
          await assignNextStore(client, confirmedOrder.id);

          await notifyOrderEvent({
            orderId: confirmedOrder.id,
            type: "order_placed",
            title: "Order Placed",
            body: `Your payment was received and order #${confirmedOrder.order_number} has been placed successfully.`,
            data: { screen: "track-order" },
            client,
          });
        }

        if (paymentStatus === "paid") {
          const confirmedOrder = result.rows[0];
          console.log(
            `Order ${confirmedOrder.order_number} paid. Handing off to the decentralized fulfillment engine...`,
          );
          // invokeFulfillmentRouter(confirmedOrder.id);
        }

        await client.query("COMMIT");
      } catch (txError) {
        await client.query("ROLLBACK");
        throw txError;
      } finally {
        client.release();
      }
    }

    /* 
    const result = await client.query(
      `
      UPDATE store_orders
      SET payment_status = $1,
          transaction_id = COALESCE($2, transaction_id),
          updated_at = NOW()
      WHERE id = $3
        AND payment_status != 'paid'
      RETURNING id, order_number
      `,
      [paymentStatus, transactionId, reference],
    );

    if (result.rowCount === 0) {
      // Return 200 to prevent gateway retries if the order was already processed or doesn't match
      return new Response("Order already processed or not found", { status: 200 });
    } 

    //  TRIGGER MULTI-STORE ROUTING SUBROUTINE HERE IF PAID!
    if (paymentStatus === "paid") {
      const confirmedOrder = result.rows[0];
      console.log(`Order ${confirmedOrder.order_number} paid. Handing off to the decentralized fulfillment engine...`);
      // invokeFulfillmentRouter(confirmedOrder.id);
    }
    */
    // console.log(`Order ${reference} → ${paymentStatus}`);

    // return NextResponse.json({ success: true });
    return new Response("TRUE", { status: 200 });
  } catch (err) {
    console.error(
      "Pay.nl asynchronous server processing webhook catch block error:",
      err,
    );
    return new Response("Internal Server Error", { status: 500 });
    // console.error("Webhook error:", err);
    // return NextResponse.json({ success: false }, { status: 500 });
  } finally {
    client.release();
  }
}
