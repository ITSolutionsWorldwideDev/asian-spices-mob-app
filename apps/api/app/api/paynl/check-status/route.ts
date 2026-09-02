// app/api/paynl/check-status/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import {
  assignNextStore,
  logOrderEvent,
  ORDER_EVENTS,
} from "@/core/order-routing";
import { sendOrderConfirmationEmail } from "@/core/email-templates";
import { notifyOrderEvent } from "@/core/notifications";

const PAYNL_API_TOKEN = process.env.PAYNL_API_TOKEN;

// Pay.nl uses both connect.pay.nl and connect.payments.nl for its v1 REST API.
const ALLOWED_PAYNL_HOSTS = new Set(["connect.pay.nl", "connect.payments.nl"]);

function normalizeSingleValue(value: unknown) {
  if (Array.isArray(value)) return String(value[0] ?? "").trim();
  return String(value ?? "").split(",")[0]?.trim() ?? "";
}

function isAllowedPaynlStatusUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && ALLOWED_PAYNL_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

// The order status lives at GET /v1/orders/{id}/status — a plain
// /v1/orders/{id} GET returns the generic PAY-0 error.
function buildPaynlStatusUrl(transactionId: string) {
  return `https://connect.pay.nl/v1/orders/${encodeURIComponent(
    transactionId,
  )}/status`;
}

function readPaynlStatus(data: unknown): string {
  const payload = data as {
    status?: { action?: string } | string;
    payment?: { status?: { action?: string } | string };
  };

  const top = payload?.status;
  if (typeof top === "string") return top.toLowerCase();
  if (top && typeof top === "object" && top.action) {
    return String(top.action).toLowerCase();
  }

  const paymentStatus = payload?.payment?.status;
  if (typeof paymentStatus === "string") return paymentStatus.toLowerCase();
  if (
    paymentStatus &&
    typeof paymentStatus === "object" &&
    paymentStatus.action
  ) {
    return String(paymentStatus.action).toLowerCase();
  }

  return "";
}

async function markPaynlOrderPaid(orderId: string, transactionId: string) {
  const client = await pool.connect();
  let shouldSendEmail = false;

  try {
    await client.query("BEGIN");

    const updateResult: any = await client.query(
      `UPDATE store_orders
       SET payment_status = 'paid',
           order_status = 'pending',
           transaction_id = COALESCE($1, transaction_id),
           updated_at = NOW()
       WHERE id = $2 AND payment_status != 'paid'
       RETURNING id`,
      [transactionId, orderId],
    );

    if ((updateResult?.rowCount ?? 0) > 0) {
      shouldSendEmail = true;

      await logOrderEvent(client, {
        orderId,
        eventType: ORDER_EVENTS.ASSIGNED,
        message: `Paynl capture successful. Captured Reference ID: ${transactionId}. Order created and routing started`,
        metadata: { transactionId },
      });

      await assignNextStore(client, orderId);
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  if (shouldSendEmail) {
    sendOrderConfirmationEmail(orderId).catch((err) =>
      console.error("[Email Trigger Error PayNL check-status]:", err),
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
}

export async function POST(req: NextRequest) {
  try {
    const {
      orderId: rawOrderId,
      statusUrl: rawStatusUrl,
      statusAction: rawStatusAction,
    } = await req.json();
    const orderId = normalizeSingleValue(rawOrderId);
    const statusUrl = normalizeSingleValue(rawStatusUrl);
    const statusAction = normalizeSingleValue(rawStatusAction).toLowerCase();

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Missing orderId" },
        { status: 400 },
      );
    }

    const { rows } = await pool.query(
      `SELECT * FROM store_orders WHERE id = $1`,
      [orderId],
    );

    const order = rows[0];

    if (!order || !order.transaction_id) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 },
      );
    }

    if (order.payment_status === "paid") {
      return NextResponse.json({
        success: true,
        paymentStatus: "paid",
        alreadyPaid: true,
      });
    }

    const paynlStatusUrl = isAllowedPaynlStatusUrl(statusUrl)
      ? statusUrl
      : buildPaynlStatusUrl(String(order.transaction_id));

    const res = await fetch(paynlStatusUrl, {
      headers: {
        Authorization: `Bearer ${PAYNL_API_TOKEN}`,
        Accept: "application/json",
      },
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Pay.nl check failed:", data);

      // The live lookup is the only trusted source for a "paid" result.
      // The client-supplied statusAction can only flag non-paid outcomes.
      if (["failed", "cancelled", "expired"].includes(statusAction)) {
        await pool.query(
          `
          UPDATE store_orders
          SET payment_status = 'failed',
              updated_at = NOW()
          WHERE id = $1 AND payment_status != 'paid'
          `,
          [orderId],
        );
        return NextResponse.json({ success: true, paymentStatus: "failed" });
      }

      return NextResponse.json(
        { success: true, paymentStatus: "pending" },
        { status: 200 },
      );
    }

    const status = readPaynlStatus(data);

    let paymentStatus: "pending" | "paid" | "failed" = "pending";

    if (status === "paid") paymentStatus = "paid";
    else if (["failed", "cancelled", "expired"].includes(status)) {
      paymentStatus = "failed";
    }

    if (paymentStatus === "paid") {
      await markPaynlOrderPaid(orderId, String(order.transaction_id));
    } else {
      await pool.query(
        `
        UPDATE store_orders
        SET payment_status = $1,
            updated_at = NOW()
        WHERE id = $2
          AND payment_status != 'paid'
        `,
        [paymentStatus, orderId],
      );
    }

    return NextResponse.json({
      success: true,
      paymentStatus,
    });
  } catch (err) {
    console.error("Check status error:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
