// app/api/paynl/confirm/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import {
  assignNextStore,
  logOrderEvent,
  ORDER_EVENTS,
} from "@/core/order-routing";

import { sendOrderConfirmationEmail } from "@/core/email-templates";
import { notifyOrderEvent } from "@/core/notifications";

export async function POST(req: NextRequest) {
  try {
    const { orderId, statusAction, transactionId } = await req.json();

    if (!orderId || !statusAction) {
      return NextResponse.json(
        { success: false, error: "Missing data" },
        { status: 400 },
      );
    }

    const action = statusAction.toLowerCase();

    console.log("action === ", action);

    let paymentStatus: "pending" | "paid" | "failed" = "pending";

    if (action === "paid") paymentStatus = "paid";
    else if (["failed", "cancelled", "expired"].includes(action)) {
      paymentStatus = "failed";
    }

    console.log("paymentStatus === ", paymentStatus);

    if (paymentStatus === "paid") {
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
               WHERE id = $2 AND payment_status != 'paid'
               RETURNING id`,
          [transactionId, orderId],
        );

        if (updateResult?.rowCount > 0) {
          shouldSendEmail = true;

          // Log payment collection completion event
          await logOrderEvent(client, {
            orderId: orderId,
            eventType: ORDER_EVENTS.ASSIGNED,
            message: `Paynl capture successful. Captured Reference ID: ${transactionId}. Order created and routing started`,
            metadata: { transactionId },
          });

          // ⚡ RUN CRITICAL STORE SELECTION PIPELINE ⚡
          console.log(
            `Executing decentralized routing for Order ID: ${orderId}`,
          );
          await assignNextStore(client, orderId);
        }

        await client.query("COMMIT");

        if (shouldSendEmail) {
          sendOrderConfirmationEmail(orderId).catch((err) =>
            console.error("[Email Trigger Error PayNL Workflow]:", err),
          );

          notifyOrderEvent({
            orderId,
            type: "order_placed",
            title: "Order Placed",
            body: "Your payment was received and your order has been placed successfully.",
            data: { screen: "track-order" },
          }).catch((err) =>
            console.error("[Notification] PayNL paid failed", err),
          );
        }

        return NextResponse.json({
          success: true,
          transactionId: transactionId,
        });
      } catch (txError) {
        await client.query("ROLLBACK");
        throw txError; // Bubbles up to outer catch block handler
      } finally {
        client.release();
      }
    }

    let query = `
      UPDATE store_orders
      SET payment_status = $1,
          transaction_id = COALESCE($2, transaction_id),
          updated_at = NOW()
      WHERE id = $3
        AND payment_status != 'paid'
      RETURNING payment_status
      `;

    const result: any = await pool.query(query, [
      paymentStatus,
      transactionId,
      orderId,
    ]);

    // console.log("result === ", result);

    return NextResponse.json({
      success: true,
      updated: result?.rowCount > 0,
    });
  } catch (err) {
    console.error("Confirm error:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
