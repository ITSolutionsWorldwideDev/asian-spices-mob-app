// app/api/create-payment/route.ts

import { pool } from "@/core/db";
import { NextRequest, NextResponse } from "next/server";

// Pay.nl config
const PAYNL_SERVICE_ID = process.env.PAYNL_SERVICE_ID;
const PAYNL_API_TOKEN = process.env.PAYNL_API_TOKEN;

// PayPal config
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;

const PAYPAL_API =
  process.env.PAYPAL_ENV === "production"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

function normalizeUrl(url: string) {
  return url.replace(/\/+$/, "");
}

function isLocalhostUrl(url: string) {
  return /:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(url);
}

function isPrivateOrLocalHost(hostname: string) {
  if (!hostname) return true;
  if (hostname === "localhost" || hostname === "127.0.0.1") return true;
  if (/^10\./.test(hostname)) return true;
  if (/^192\.168\./.test(hostname)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)) return true;
  return false;
}

function resolveSiteUrl(req: NextRequest) {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    "";

  const requestOrigin = req.nextUrl?.origin
    ? normalizeUrl(req.nextUrl.origin)
    : "";

  // Prefer configured public/LAN URL over localhost.
  // Phones cannot open localhost on your PC.
  if (configured) {
    const normalizedConfigured = normalizeUrl(configured);
    if (!isLocalhostUrl(normalizedConfigured)) {
      return normalizedConfigured;
    }
    if (!requestOrigin || isLocalhostUrl(requestOrigin)) {
      return normalizedConfigured;
    }
  }

  if (requestOrigin && !isLocalhostUrl(requestOrigin)) {
    return requestOrigin;
  }

  const forwardedProto = req.headers.get("x-forwarded-proto");
  const forwardedHost = req.headers.get("x-forwarded-host");
  const forwardedPort = req.headers.get("x-forwarded-port");
  const host = forwardedHost || req.headers.get("host");

  if (host && !isLocalhostUrl(`http://${host}`)) {
    const proto = forwardedProto || "http";
    const hasPort = /:\d+$/.test(host);
    const hostWithPort =
      !hasPort && forwardedPort ? `${host}:${forwardedPort}` : host;
    return normalizeUrl(`${proto}://${hostWithPort}`);
  }

  if (configured) {
    return normalizeUrl(configured);
  }

  if (requestOrigin) {
    return requestOrigin;
  }

  return "http://localhost:3000";
}

function shouldSendExchangeUrl(siteUrl: string) {
  try {
    const parsed = new URL(siteUrl);
    return parsed.protocol === "https:" && !isPrivateOrLocalHost(parsed.hostname);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const siteUrl = resolveSiteUrl(req);
    const exchangeUrl = `${siteUrl}/api/paynl/webhook`;
    const includeExchangeUrl = shouldSendExchangeUrl(siteUrl);
    const {
      orderId,
      amount,
      customerEmail,
      paymentMethod,
      returnUrl,
      cancelUrl,
      appReturnUrl,
    } =
      await req.json();

    if (!orderId || !amount || !customerEmail || !paymentMethod) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const mobileReturnUrl =
      typeof appReturnUrl === "string" && appReturnUrl.trim().length > 0
        ? appReturnUrl.trim()
        : null;
    const successCallbackParams = new URLSearchParams({ orderId: String(orderId) });
    if (mobileReturnUrl) {
      successCallbackParams.set("appReturnUrl", mobileReturnUrl);
    }
    const cancelCallbackParams = new URLSearchParams(successCallbackParams);
    cancelCallbackParams.set("status", "cancel");

    const defaultReturnUrl = `${siteUrl}/checkout/success?${successCallbackParams.toString()}`;
    const defaultCancelUrl = `${siteUrl}/checkout/cancel?${cancelCallbackParams.toString()}`;
    const resolvedReturnUrl =
      typeof returnUrl === "string" && returnUrl.trim().length > 0
        ? returnUrl.trim()
        : defaultReturnUrl;
    const resolvedCancelUrl =
      typeof cancelUrl === "string" && cancelUrl.trim().length > 0
        ? cancelUrl.trim()
        : defaultCancelUrl;

    // Fetch order from DB
    const orderRes = await pool.query(
      `SELECT * FROM store_orders WHERE id = $1`,
      [orderId],
    );
    if (!orderRes.rows.length)
      return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const order = orderRes.rows[0];

    //  Guard against price tampering
    if (Math.abs(Number(order.total_amount) - Number(amount)) > 0.01) {
      return NextResponse.json({ error: "Amount mismatch detected" }, { status: 400 });
    }

    if (order.payment_status === "paid") {
      return NextResponse.json({ error: "Order already completed" }, { status: 400 });
    }
    
    // ====================================================
    // PAY.NL GATEWAY INTEGRATION
    // ====================================================

    if (paymentMethod === "paynl") {
      // 1. CREATE ORDER
      const orderResponse = await fetch("https://connect.pay.nl/v1/orders", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYNL_API_TOKEN}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(
          includeExchangeUrl
            ? {
                serviceId: PAYNL_SERVICE_ID,
                amount: {
                  value: Math.round(Number(amount) * 100), // ✅ integer in cents
                  currency: "EUR",
                },
                description: `Order ${order.order_number}`,
                reference: order.id.toString(),
                returnUrl: resolvedReturnUrl,
                exchangeUrl,
                customer: {
                  email: customerEmail,
                },
              }
            : {
                serviceId: PAYNL_SERVICE_ID,
                amount: {
                  value: Math.round(Number(amount) * 100), // ✅ integer in cents
                  currency: "EUR",
                },
                description: `Order ${order.order_number}`,
                reference: order.id.toString(),
                returnUrl: resolvedReturnUrl,
                customer: {
                  email: customerEmail,
                },
              },
        ),
      });

      const orderData = await orderResponse.json();
      console.log("orderData", orderData);
      console.log("orderResponse", orderResponse);

      if (!orderResponse.ok) {
        console.error("Pay.nl execution setup failure:", orderData);
        return NextResponse.json({ error: "Payment gateway validation failed" }, { status: 502 });
      }

      const paynlOrderId = orderData.id;
      
      // const redirectUrl = orderData.links?.checkout || orderData.links?.redirect;

      // if (!redirectUrl) {
      //   return NextResponse.json({ error: "Gateway failed to return redirect destination" }, { status: 502 });
      // }

      // 2. CREATE PAYMENT
      const paymentResponse = await fetch(
        `https://connect.pay.nl/v1/orders/${paynlOrderId}/payments`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${PAYNL_API_TOKEN}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(
            includeExchangeUrl
              ? {
                  paymentMethod: {
                    id: 10, // ✅ choose method
                  },
                  returnUrl: resolvedReturnUrl,
                  exchangeUrl,
                }
              : {
                  paymentMethod: {
                    id: 10, // ✅ choose method
                  },
                  returnUrl: resolvedReturnUrl,
                },
          ),
        },
      );

      const paymentData = await paymentResponse.json();

      if (!paymentResponse.ok) {
        console.error("Pay.nl payment error:", paymentData);
        throw new Error("Payment creation failed");
      }

      const redirectUrl =
        paymentData?.links?.checkout ||
        paymentData?.links?.redirect ||
        paymentData?.checkoutUrl ||
        paymentData?.redirectUrl;

      if (!redirectUrl) {
        console.error("Missing redirect URL:", paymentData);
        throw new Error("No redirect URL from Pay.nl");
      }

      await pool.query(
        `
        UPDATE store_orders
        SET transaction_id = $1,
            payment_method = $2,
            payment_status = 'pending',
            updated_at = NOW()
        WHERE id = $3
        `,
        [paynlOrderId, "paynl", order.id],
      );

      return NextResponse.json({
        success: true,
        orderId: String(orderId),
        orderNumber: order.order_number,
        redirectUrl,
        transactionId: paynlOrderId,
        statusUrl: paymentData?.links?.status,
      });
    }

    if (paymentMethod === "paypal") {
      if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
        return NextResponse.json(
          { error: "PayPal is not configured on the server" },
          { status: 503 },
        );
      }

      const { approveLink, orderData } = await createPayPalOrder(
        order.order_number,
        Number(amount),
        resolvedReturnUrl,
        resolvedCancelUrl,
      );

      if (!approveLink) {
        return NextResponse.json({ error: "PayPal routing initialization failed" }, { status: 502 });
      }

      // Save PayPal order ID as transaction_id
      await pool.query(
        `UPDATE store_orders SET transaction_id = $1, payment_method = $2 WHERE id = $3`,
        [orderData.id, "paypal", order.id],
      );

      return NextResponse.json({
        success: true,
        orderId: String(orderId),
        orderNumber: order.order_number,
        redirectUrl: approveLink,
        transactionId: orderData.id,
      });
    }

    return NextResponse.json(
      { error: "Unsupported payment method" },
      { status: 400 },
    );
  } catch (err) {
    console.error("Create payment execution exception error:", err);
    return NextResponse.json({ error: "Internal payment handler failure" }, { status: 500 });
  }
}

async function createPayPalOrder(
  orderNumber: string,
  amount: number,
  returnUrl: string,
  cancelUrl: string,
) {
  // 1. Get access token
  const tokenRes = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!tokenRes.ok) throw new Error("Failed to acquire authorized PayPal payload token.");

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;

  // 2. Create order
  const orderRes = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: orderNumber,
          amount: {
            currency_code: "EUR",
            value: amount.toFixed(2),
          },
        },
      ],
      application_context: {
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
    }),
  });

  const orderData = await orderRes.json();

  if (!orderRes.ok) {
    console.error("PayPal order creation failed:", orderData);
    throw new Error(
      orderData?.message || "Failed to create PayPal checkout order",
    );
  }

  const approveLink = orderData.links?.find(
    (link: { rel?: string; href?: string }) => link.rel === "approve",
  )?.href;

  return { orderData, approveLink };
}

