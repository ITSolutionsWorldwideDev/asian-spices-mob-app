// app/api/paypal/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { assignNextStore, logOrderEvent, ORDER_EVENTS } from "@/core/order-routing";
import { sendOrderConfirmationEmail } from "@/core/email-templates";

// PayPal Webhook verification endpoint
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;

const PAYPAL_API =
  process.env.PAYPAL_ENV === "production"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";


// Verify PayPal webhook signature
async function verifyPayPalWebhook(req: NextRequest, body: any) {

  const transmissionId = req.headers.get("paypal-transmission-id");
  const timestamp = req.headers.get("paypal-transmission-time");

  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  
  const signature = req.headers.get("paypal-transmission-sig");
  const certUrl = req.headers.get("paypal-cert-url");
  const authAlgo = req.headers.get("paypal-auth-algo");

  const accessTokenRes = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const accessToken = (await accessTokenRes.json()).access_token;

  const verifyRes = await fetch(`${PAYPAL_API}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth_algo: authAlgo,
      cert_url: certUrl,
      transmission_id: transmissionId,
      transmission_sig: signature,
      transmission_time: timestamp,
      webhook_id: webhookId,
      webhook_event: body,
    }),
  });

  const verifyData = await verifyRes.json();
  return verifyData.verification_status === "SUCCESS";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1️⃣ Verify webhook
    const isValid = await verifyPayPalWebhook(req, body);
    if (!isValid) {
      console.warn("Invalid PayPal webhook signature", body);
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
    }

    // 2️⃣ Only handle completed payments
    if (body.event_type === "CHECKOUT.ORDER.APPROVED" || body.event_type === "PAYMENT.CAPTURE.COMPLETED") {

      // In a capture webhook event context, the resource contains the tokenized parent tracking key values
      const paypalOrderId = body.resource.supplementary_data?.related_ids?.order_id || body.resource.parent_payment || body.resource.id;
      
      if (!paypalOrderId) {
        console.error("Could not parse explicit payment mapping parameters from webhook body resource wrapper layout.");
        return NextResponse.json({ success: true }); // Acknowledge to prevent infinite retries
      }

      const client = await pool.connect();
      let confirmedOrderId: string | null = null;
      try {
        await client.query("BEGIN");

        // Fetch target row using the unique tracking reference key token
        const orderRes = await client.query(
          `SELECT id, payment_status FROM store_orders WHERE transaction_id = $1 AND payment_method = 'paypal'`,
          [paypalOrderId]
        );

        if (orderRes.rows.length && orderRes.rows[0].payment_status !== "paid") {
          const orderId = orderRes.rows[0].id;
          confirmedOrderId = orderId;

          // Update order state safely to processing status rows
          await client.query(
            `UPDATE store_orders
             SET payment_status = 'paid', order_status = 'pending', updated_at = NOW()
             WHERE id = $1`,
            [orderId]
          );

          await logOrderEvent(client, {
            orderId: orderId,
            eventType: ORDER_EVENTS.ASSIGNED,
            message: "PayPal Webhook asynchronous settlement verified. Initiating routing engine triggers.",
            metadata: { webhook_event_id: body.id },
          });

          // ⚡ EXECUTE ASYNCHRONOUS ENGINE HANDOFF ⚡
          await assignNextStore(client, orderId);
          console.log(`Webhook fallback process successfully routed Order #${orderId} out to store networks.`);
        }

        await client.query("COMMIT");
      } catch (txError) {
        await client.query("ROLLBACK");
        throw txError;
      } finally {
        client.release();
      }

      if (confirmedOrderId) {
        try {
          await sendOrderConfirmationEmail(confirmedOrderId);
        } catch (emailErr) {
          console.error("[Email Trigger Error PayPal Webhook]:", emailErr);
        }
      }

      /* 
      const orderId = body.resource.id; // PayPal Order ID (stored as transaction_id)

      // 3️⃣ Update order in DB
      await pool.query(
        `UPDATE store_orders
         SET payment_status = 'paid', order_status = 'completed', updated_at = NOW()
         WHERE transaction_id = $1 AND payment_method = 'paypal'`,
        [orderId]
      );
      */
      console.log(`Order ${paypalOrderId} marked as paid/completed`);
    } else if (
      body.event_type === "PAYMENT.CAPTURE.DENIED" ||
      body.event_type === "PAYMENT.CAPTURE.DECLINED" ||
      body.event_type === "CHECKOUT.ORDER.VOIDED"
    ) {
      const paypalOrderId =
        body.resource?.supplementary_data?.related_ids?.order_id ||
        body.resource?.parent_payment ||
        body.resource?.id;

      if (paypalOrderId) {
        await pool
          .query(
            `UPDATE store_orders
             SET payment_status = 'failed',
                 updated_at = NOW()
             WHERE transaction_id = $1
               AND payment_method = 'paypal'
               AND payment_status != 'paid'`,
            [paypalOrderId],
          )
          .catch((dbErr) =>
            console.error("PayPal webhook failed status update error:", dbErr),
          );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PayPal webhook error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
