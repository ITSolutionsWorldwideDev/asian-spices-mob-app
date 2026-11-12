// core/email-templates.ts

import fs from "fs";
import path from "path";
import { pool } from "./db";
import { sendEmail } from "./email";
import {
  generatePartnerVerificationEmailHtml,
  generatePartnerVerificationEmailText,
} from "./utils/mails/partner-verification";
import {
  generatePartnerApplicationEmailHtml,
  generatePartnerApplicationEmailText,
} from "./utils/mails/partner-application";
import {
  generateOrderConfirmationEmailHtml,
  generateOrderConfirmationEmailText,
  OrderItem,
} from "./utils/mails/order-confirmation";
import {
  generateAccountRegistrationEmailHtml,
  generateAccountRegistrationEmailText,
} from "./utils/mails/account-reg";
import {
  generateOrderCancelEmailHtml,
  generateOrderCancelEmailText,
  CancelledItem,
} from "./utils/mails/order-cancel";
import {
  generateReturnConfirmationEmailHtml,
  generateReturnConfirmationEmailText,
  ReturnItem,
} from "./utils/mails/return-confirmation";
import {
  generateReturnProcessedEmailHtml,
  generateReturnProcessedEmailText,
  ProcessedReturnItem,
} from "./utils/mails/return-processed";
import {
  generatePartnerCredentialsEmailHtml,
  generatePartnerCredentialsEmailText,
} from "./utils/mails/partner-credentials";
import { getEmailBrandingAttachments, renderEmailSocialFooter } from "./utils/mails/shared";

/**
 * Feature flag for the customer confirmation email when the Contact Us form is submitted.
 * - Set to `true`: Temporarily sends the Dutch "Partner Verification Email" (Welkom als goedgekeurde partner).
 * - Set to `false`: Reverts back to the standard "We've Received Your Message" confirmation email.
 * Note: The admin notification to support@asianspices.online is ALWAYS preserved and sent regardless of this flag.
 */
export const USE_TEMP_PARTNER_CONFIRMATION_EMAIL = false;

// Map delivery expectations contextually
const DELIVERY_DAYS_MAP: Record<string, string> = {
  "Standard Shipping": "3 - 5 business days",
  "Express Shipping": "1 - 2 business days",
  "Overnight Shipping": "Next business day",
};

interface PartnerOnboardingEmailOptions {
  email: string;
  companyName: string;
  firstName: string;
  applicationId: string;
}

interface PasswordResetEmailOptions {
  email: string;
  otp?: string;
  token?: string;
  firstName?: string;
}

interface GuestAccountCreatedEmailOptions {
  email: string;
  password: string;
  firstName?: string;
}

interface ContactFormEmailOptions {
  fullName: string;
  email: string;
  subject: string;
  message: string;
}

function formatDutchDeliveryDate(
  createdAt: Date | string | null,
  provider?: string,
): string {
  const baseDate = createdAt ? new Date(createdAt) : new Date();
  let daysToAdd = 3;
  const p = (provider || "").toLowerCase();
  if (p.includes("express") || p.includes("overnight") || p.includes("1 - 2")) {
    daysToAdd = 1;
  }
  const estDate = new Date(baseDate);
  estDate.setDate(estDate.getDate() + daysToAdd);
  if (estDate.getDay() === 0) estDate.setDate(estDate.getDate() + 1); // Sunday -> Monday
  if (estDate.getDay() === 6) estDate.setDate(estDate.getDate() + 2); // Saturday -> Monday

  try {
    return estDate.toLocaleDateString("nl-NL", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  } catch {
    return `${estDate.getDate()} ${estDate.toLocaleString("nl-NL", { month: "long" })}`;
  }
}

export async function sendOrderConfirmationEmail(orderId: string, customClient?: any, options?: { force?: boolean }) {
  const db = customClient || pool;
  try {
    // 0️⃣ Idempotency guard: Prevent duplicate order confirmation emails
    const existingSentEvent = await db.query(
      `SELECT id FROM order_events WHERE order_id = $1 AND event_type = 'confirmation_email_sent' LIMIT 1`,
      [orderId],
    ).catch(() => null);

    if (existingSentEvent && (existingSentEvent.rowCount ?? 0) > 0) {
      console.log(`[Email Skipped] Order confirmation email already sent for order ${orderId}`);
      return { success: true, alreadySent: true };
    }

    // 1️⃣ Fetch complete payload variables for the email (with fallback to linked customer/user profiles)
    const orderQuery = await db.query(
      `SELECT 
         o.id,
         o.order_number, 
         o.payment_status,
         COALESCE(
           NULLIF(TRIM(o.customer_email), ''), 
           NULLIF(TRIM(c.email), ''), 
           NULLIF(TRIM(u.email), '')
         ) AS customer_email, 
         o.total_amount,
         o.subtotal,
         o.shipping_amount,
         o.tax_amount,
         o.discount_amount,
         o.shipping_address_line1,
         o.shipping_address_line2,
         o.shipping_city,
         o.shipping_state,
         o.shipping_postal_code,
         o.shipping_country,
         o.shipping_provider,
         o.created_at,
         COALESCE(
           NULLIF(TRIM(c.first_name), ''),
           NULLIF(TRIM(SPLIT_PART(u.name, ' ', 1)), ''),
           NULLIF(TRIM(oe.metadata->'customer'->>'firstName'), ''),
           NULLIF(TRIM(SPLIT_PART(oe.metadata->'customer'->>'name', ' ', 1)), ''),
           NULLIF(TRIM(oe.metadata->>'firstName'), ''),
           NULLIF(TRIM(SPLIT_PART(oe.metadata->>'name', ' ', 1)), ''),
           NULLIF(TRIM(SPLIT_PART(oe.metadata->>'customer_name', ' ', 1)), ''),
           NULLIF(TRIM(c.last_name), '')
         ) AS first_name,
         COALESCE(
           NULLIF(TRIM(c.last_name), ''),
           NULLIF(TRIM(SUBSTRING(u.name FROM POSITION(' ' IN u.name) + 1)), ''),
           NULLIF(TRIM(oe.metadata->'customer'->>'lastName'), ''),
           NULLIF(TRIM(oe.metadata->>'lastName'), '')
         ) AS last_name,
         (
           SELECT metadata->>'guest_temp_password'
           FROM order_events
           WHERE order_id = o.id AND event_type = 'created'
           LIMIT 1
         ) AS guest_temp_password
       FROM store_orders o
       LEFT JOIN store_customers c ON (o.customer_id = c.id OR (o.customer_email IS NOT NULL AND LOWER(c.email) = LOWER(o.customer_email)))
       LEFT JOIN users u ON (c.user_id = u.id OR (o.customer_email IS NOT NULL AND LOWER(u.email) = LOWER(o.customer_email)))
       LEFT JOIN LATERAL (
         SELECT metadata
         FROM order_events
         WHERE order_id = o.id AND (event_type = 'created' OR metadata->>'customer' IS NOT NULL)
         ORDER BY id ASC
         LIMIT 1
       ) oe ON true
       WHERE o.id = $1`,
      [orderId],
    );

    if (orderQuery.rowCount === 0)
      return { success: false, error: "Order context missing" };

    const order = orderQuery.rows[0];

    const isPaid = String(order.payment_status || "").toLowerCase() === "paid";
    if (!isPaid && !options?.force) {
      console.log(
        `[Email Skipped] Order ${orderId} payment_status is '${order.payment_status}' — confirmation email only sends when payment is 'paid'`,
      );
      return {
        success: false,
        error: "Order payment is not confirmed as paid",
      };
    }

    const recipientEmail = order.customer_email?.trim();

    if (!recipientEmail) {
      console.error(`[Email Skipped] Order ${orderId} has no customer_email in store_orders or customer records`);
      return { success: false, error: "customer_email is null or missing" };
    }

    // Ensure store_orders.customer_email is backfilled if it was previously empty
    await db.query(
      `UPDATE store_orders SET customer_email = $1 WHERE id = $2 AND (customer_email IS NULL OR TRIM(customer_email) = '')`,
      [recipientEmail, orderId],
    ).catch(() => { });

    // 2️⃣ Fetch order items with product titles, SKUs, and primary images
    const itemsQuery = await db.query(
      `SELECT 
        oi.quantity,
        oi.price,
        COALESCE(p.name, 'Product') AS name,
        p.sku,
        COALESCE(md.file_url, CASE WHEN pi.url ~ '^https?://' THEN pi.url ELSE NULL END) AS image_url
       FROM store_order_items oi
       LEFT JOIN store_products p ON p.id = oi.product_id
       LEFT JOIN (
         SELECT DISTINCT ON (pi_sub.product_id) 
           pi_sub.product_id, 
           pi_sub.url
         FROM store_product_images pi_sub
         ORDER BY pi_sub.product_id, pi_sub.is_primary DESC, pi_sub.id ASC
       ) pi ON pi.product_id = p.id
       LEFT JOIN media md ON md.media_id = CASE WHEN pi.url ~ '^[0-9]+$' THEN pi.url::int ELSE NULL END
       WHERE oi.order_id = $1`,
      [orderId],
    );

    // 3️⃣ Map data to template format
    let rawFirstName = (order.first_name || "").trim();
    if (rawFirstName && (rawFirstName.toLowerCase() === 'klant' || rawFirstName.includes('{{'))) {
      rawFirstName = "";
    }
    let firstName = rawFirstName
      ? rawFirstName.charAt(0).toUpperCase() + rawFirstName.slice(1)
      : "";

    const addressParts = [
      order.shipping_address_line1,
      order.shipping_address_line2,
    ]
      .map((s: string | null) => (s || "").trim())
      .filter(Boolean);
    const deliveryAddress = addressParts.join(", ") || "Adres op aanvraag";
    const postalCode = (order.shipping_postal_code || "").trim();
    const city = (order.shipping_city || "").trim();

    const items: OrderItem[] = (itemsQuery.rows || []).map((it: any) => ({
      name: it.name || "Product",
      sku: it.sku || undefined,
      quantity: Number(it.quantity || 1),
      price: Number(it.price || 0).toFixed(2),
      imageUrl: it.image_url || undefined,
    }));

    const shippingAmountNum = Number(order.shipping_amount || 0);
    const shippingCost =
      shippingAmountNum > 0 ? shippingAmountNum.toFixed(2) : "Gratis";
    const totalAmountNum = Number(order.total_amount || 0);
    const subtotalNum =
      order.subtotal !== null && order.subtotal !== undefined
        ? Number(order.subtotal)
        : Math.max(0, totalAmountNum - shippingAmountNum);
    const rewardPoints = Math.floor(totalAmountNum);

    const deliveryDateStr = formatDutchDeliveryDate(
      order.created_at,
      order.shipping_provider,
    );

    const guestPassword = order.guest_temp_password?.trim() || undefined;
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://asianspices.online";
    const loginUrl = `${siteUrl.replace(/\/$/, "")}/login`;

    const emailData = {
      orderNumber: order.order_number,
      firstName,
      lastName: order.last_name || undefined,
      email: recipientEmail,
      guestPassword,
      loginUrl,
      orderDate: new Date(order.created_at || Date.now()).toLocaleDateString(
        "nl-NL",
        {
          day: "numeric",
          month: "long",
          year: "numeric",
        },
      ),
      deliveryDate: deliveryDateStr,
      deliveryAddress,
      postalCode,
      city,
      items: items.length > 0 ? items : undefined,
      subtotal: subtotalNum.toFixed(2),
      shippingCost,
      rewardPoints,
      totalAmount: totalAmountNum.toFixed(2),
      orderStatusUrl: `${siteUrl.replace(/\/$/, "")}/account/orders`,
      helpPageUrl: `${siteUrl.replace(/\/$/, "")}/contact-us`,
      supportEmail: "klantenservice@asianspices.nl",
    };

    // 4️⃣ Generate HTML and Plaintext via the modern Dutch template
    const emailHtml = generateOrderConfirmationEmailHtml(emailData);
    const emailText = generateOrderConfirmationEmailText(emailData);

    const brandingAttachments = getEmailBrandingAttachments();

    // 5️⃣ Dispatch (try "order" profile, fallback to "support", then fallback to "partners")
    // const orderBcc = [
    //   "sales@asianspices.online",
    //   "order@asianspices.online",
    //   // "cheila.lopes@itsolutionshub2010.com",
    //   // "ahmed.mehmood@itsolutionshub2010.com",
    //   // "zraja@itsolutionsworldwide.com",
    //   // "sdevi@itsolutionsworldwide.com",
    //   "ahmad.raza@itsolutionsworldwide.com",
    // ];
    const orderBcc: string[] = []; // BCC empty: prevents 550 SPAM rejections from mass-BCC internal aliases

    try {
      await sendEmail({
        to: recipientEmail,
        bcc: orderBcc,
        subject: `Bestelbevestiging #${order.order_number} - Asian Spices`,
        html: emailHtml,
        text: emailText,
        attachments: brandingAttachments,
        fromAccount: "order",
      });
    } catch (orderProfileError) {
      console.warn("Order confirmation failed via 'order' profile, falling back to 'support' profile:", orderProfileError);
      try {
        await sendEmail({
          to: recipientEmail,
          bcc: orderBcc,
          subject: `Bestelbevestiging #${order.order_number} - Asian Spices`,
          html: emailHtml,
          text: emailText,
          attachments: brandingAttachments,
          fromAccount: "support",
        });
      } catch (supportProfileError) {
        console.warn("Order confirmation failed via 'support' profile, falling back to 'partners' profile:", supportProfileError);
        await sendEmail({
          to: recipientEmail,
          bcc: orderBcc,
          subject: `Bestelbevestiging #${order.order_number} - Asian Spices`,
          html: emailHtml,
          text: emailText,
          attachments: brandingAttachments,
          fromAccount: "partners",
        });
      }
    }

    // Record confirmation email dispatched event for idempotency
    await db.query(
      `INSERT INTO order_events (order_id, event_type, metadata) VALUES ($1, 'confirmation_email_sent', $2)`,
      [orderId, JSON.stringify({ sent_at: new Date().toISOString(), to: recipientEmail })],
    ).catch(() => { });

    return { success: true };
  } catch (error) {
    console.error(
      "Error generating or dispatching order email template:",
      error,
    );
    return { success: false, error };
  }
}

function escapeEmailText(value: string) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendCancellationEmail(
  orderId: string,
  refundStatus?: string,
  reason?: string,
  comments?: string,
  amounts?: {
    orderTotal: number;
    refundAmount: number;
    subtotal?: number;
    shippingAmount?: number;
    taxAmount?: number;
  },
) {
  try {
    const orderQuery = await pool.query(
      `SELECT 
         o.id,
         o.order_number, 
         COALESCE(
           NULLIF(TRIM(o.customer_email), ''), 
           NULLIF(TRIM(c.email), ''), 
           NULLIF(TRIM(u.email), '')
         ) AS customer_email,
         o.total_amount, 
         o.subtotal, 
         o.shipping_amount, 
         o.tax_amount, 
         o.shipping_provider, 
         o.payment_status,
         o.payment_method,
         COALESCE(
           NULLIF(TRIM(c.first_name), ''),
           NULLIF(TRIM(SPLIT_PART(u.name, ' ', 1)), ''),
           NULLIF(TRIM(oe.metadata->'customer'->>'firstName'), ''),
           NULLIF(TRIM(SPLIT_PART(oe.metadata->'customer'->>'name', ' ', 1)), ''),
           NULLIF(TRIM(oe.metadata->>'firstName'), ''),
           NULLIF(TRIM(SPLIT_PART(oe.metadata->>'name', ' ', 1)), ''),
           NULLIF(TRIM(SPLIT_PART(oe.metadata->>'customer_name', ' ', 1)), ''),
           NULLIF(TRIM(c.last_name), '')
         ) AS first_name,
         COALESCE(
           NULLIF(TRIM(c.last_name), ''),
           NULLIF(TRIM(SUBSTRING(u.name FROM POSITION(' ' IN u.name) + 1)), ''),
           NULLIF(TRIM(oe.metadata->'customer'->>'lastName'), ''),
           NULLIF(TRIM(oe.metadata->>'lastName'), '')
         ) AS last_name
       FROM store_orders o
       LEFT JOIN store_customers c ON (o.customer_id = c.id OR (o.customer_email IS NOT NULL AND LOWER(c.email) = LOWER(o.customer_email)))
       LEFT JOIN users u ON (c.user_id = u.id OR (o.customer_email IS NOT NULL AND LOWER(u.email) = LOWER(o.customer_email)))
       LEFT JOIN LATERAL (
         SELECT metadata
         FROM order_events
         WHERE order_id = o.id AND (event_type = 'created' OR metadata->>'customer' IS NOT NULL)
         ORDER BY id ASC
         LIMIT 1
       ) oe ON true
       WHERE o.id = $1`,
      [orderId],
    );

    if (orderQuery.rowCount === 0) {
      return { success: false, error: "Order context missing" };
    }

    const order = orderQuery.rows[0];
    const recipientEmail = order.customer_email?.trim();
    if (!recipientEmail) {
      console.error(`[Email Skipped] Order ${orderId} has no customer_email`);
      return { success: false, error: "Customer email missing" };
    }

    // Fetch order line items if present
    const itemsQuery = await pool.query(
      `SELECT 
         oi.quantity,
         oi.price,
         COALESCE(p.name, 'Product') AS name,
         p.sku,
         COALESCE(md.file_url, CASE WHEN pi.url ~ '^https?://' THEN pi.url ELSE NULL END) AS image_url
       FROM store_order_items oi
       LEFT JOIN store_products p ON p.id = oi.product_id
       LEFT JOIN (
         SELECT DISTINCT ON (pi_sub.product_id) 
           pi_sub.product_id, 
           pi_sub.url
         FROM store_product_images pi_sub
         ORDER BY pi_sub.product_id, pi_sub.is_primary DESC, pi_sub.id ASC
       ) pi ON pi.product_id = p.id
       LEFT JOIN media md ON md.media_id = CASE WHEN pi.url ~ '^[0-9]+$' THEN pi.url::int ELSE NULL END
       WHERE oi.order_id = $1`,
      [orderId],
    );

    const cancelledItems: CancelledItem[] = (itemsQuery.rows || []).map((it: any) => ({
      name: it.name || "Product",
      sku: it.sku || undefined,
      quantity: Number(it.quantity || 1),
      price: Number(it.price || 0).toFixed(2),
      imageUrl: it.image_url || undefined,
    }));

    let rawFirstName = (order.first_name || "").trim();
    if (rawFirstName && (rawFirstName.toLowerCase() === 'klant' || rawFirstName.includes('{{'))) {
      rawFirstName = "";
    }
    let firstName = rawFirstName
      ? rawFirstName.charAt(0).toUpperCase() + rawFirstName.slice(1)
      : "";

    const orderTotalNum = Number(amounts?.orderTotal ?? order.total_amount ?? 0);
    const orderTotalStr = orderTotalNum > 0 ? orderTotalNum.toFixed(2) : "0.00";
    const paymentMethod = order.payment_method || "Online betaling";

    const emailHtml = generateOrderCancelEmailHtml({
      orderNumber: order.order_number,
      firstName,
      lastName: order.last_name || undefined,
      items: cancelledItems.length > 0 ? cancelledItems : undefined,
      paymentMethod,
      totalAmount: orderTotalStr,
      supportEmail: "support@asianspices.online",
      phoneNumber: "06 44844844",
    });

    const emailText = generateOrderCancelEmailText({
      orderNumber: order.order_number,
      firstName,
      lastName: order.last_name || undefined,
      items: cancelledItems.length > 0 ? cancelledItems : undefined,
      paymentMethod,
      totalAmount: orderTotalStr,
      supportEmail: "support@asianspices.online",
      phoneNumber: "06 44844844",
    });

    const brandingAttachments = getEmailBrandingAttachments();

    try {
      await sendEmail({
        to: recipientEmail,
        cc: [
          "sales@asianspices.online",
          "order@asianspices.online",
          // "cheila.lopes@itsolutionshub2010.com",
          "ahmed.mehmood@itsolutionshub2010.com",
          // "zraja@itsolutionsworldwide.com",
          // "sdevi@itsolutionsworldwide.com",
        ],
        subject: `Bestelling geannuleerd #${order.order_number} - Asian Spices`,
        html: emailHtml,
        text: emailText,
        attachments: brandingAttachments,
        fromAccount: "order",
      });
    } catch (orderProfileError) {
      console.warn("Cancellation email failed via 'order' profile, falling back to 'support' profile:", orderProfileError);
      await sendEmail({
        to: recipientEmail,
        cc: [
          "sales@asianspices.online",
          "order@asianspices.online",
          // "cheila.lopes@itsolutionshub2010.com",
          "ahmed.mehmood@itsolutionshub2010.com",
          // "zraja@itsolutionsworldwide.com",
          // "sdevi@itsolutionsworldwide.com",
        ],
        subject: `Bestelling geannuleerd #${order.order_number} - Asian Spices`,
        html: emailHtml,
        text: emailText,
        attachments: brandingAttachments,
        fromAccount: "support",
      });
    }

    return { success: true };
  } catch (error) {
    console.error(
      `[Cancellation Email Dispatch Failure] Order ID: ${orderId}`,
      error,
    );
    return { success: false, error };
  }
}

export async function sendPartnerRegistrationEmail({
  email,
  companyName,
  firstName,
  applicationId,
}: PartnerOnboardingEmailOptions) {
  try {
    const safeFirstName = (firstName || "").trim() || "Partner";
    const brandingAttachments = getEmailBrandingAttachments();

    const emailHtml = generatePartnerApplicationEmailHtml({
      companyName,
      firstName: safeFirstName,
      email,
      applicationId,
    });

    const emailText = generatePartnerApplicationEmailText({
      companyName,
      firstName: safeFirstName,
      email,
      applicationId,
    });

    await sendEmail({
      to: email,
      cc: [
        "ahmed.mehmood@itsolutionshub2010.com",
        // "zraja@itsolutionsworldwide.com",
        // "sdevi@itsolutionsworldwide.com",
      ],
      subject: `Uw partneraanvraag is ontvangen (${applicationId}) - Asian Spices`,
      html: emailHtml,
      text: emailText,
      attachments: brandingAttachments,
      fromAccount: "partners",
    });

    return { success: true };
  } catch (error) {
    console.error(
      `[Partner Email Dispatch Failure] Application ID: ${applicationId}`,
      error,
    );
    return { success: false, error };
  }
}

export async function sendPartnerVerificationEmail(options: {
  email: string;
  fullName?: string;
  lastName?: string;
}) {
  try {
    const brandingAttachments = getEmailBrandingAttachments();

    const emailHtml = generatePartnerVerificationEmailHtml({
      fullName: options.fullName,
      lastName: options.lastName,
      email: options.email,
    });

    const emailText = generatePartnerVerificationEmailText({
      fullName: options.fullName,
      lastName: options.lastName,
      email: options.email,
    });

    await sendEmail({
      to: options.email,
      cc: [
        "ahmed.mehmood@itsolutionshub2010.com",
        // "zraja@itsolutionsworldwide.com",
        // "sdevi@itsolutionsworldwide.com",
      ],
      subject: "Welkom als goedgekeurde partner - Asian Spices",
      html: emailHtml,
      text: emailText,
      attachments: brandingAttachments,
      fromAccount: "partners",
    });

    return { success: true };
  } catch (error) {
    console.error("[Partner Verification Email Fail]", error);
    return { success: false, error };
  }
}

export interface PartnerCredentialsEmailOptions {
  email: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  tempPassword?: string;
  loginUrl?: string;
  contactUrl?: string;
}

export async function sendPartnerCredentialsEmail({
  email,
  firstName,
  lastName,
  username,
  tempPassword,
  loginUrl,
  contactUrl,
}: PartnerCredentialsEmailOptions) {
  try {
    const brandingAttachments = getEmailBrandingAttachments();

    const emailHtml = generatePartnerCredentialsEmailHtml({
      firstName,
      lastName,
      username: username || email,
      tempPassword,
      loginUrl,
      contactUrl,
    });

    const emailText = generatePartnerCredentialsEmailText({
      firstName,
      lastName,
      username: username || email,
      tempPassword,
      loginUrl,
      contactUrl,
    });

    try {
      await sendEmail({
        to: email,
        cc: [
          "ahmed.mehmood@itsolutionshub2010.com",
          // "zraja@itsolutionsworldwide.com",
          // "sdevi@itsolutionsworldwide.com",
        ],
        subject: "Uw partneromgeving staat voor u klaar - Asian Spices",
        html: emailHtml,
        text: emailText,
        attachments: brandingAttachments,
        fromAccount: "partners",
      });
    } catch (partnerProfileError) {
      console.warn(
        "Partner credentials email failed via 'partners' profile, trying 'support':",
        partnerProfileError,
      );
      await sendEmail({
        to: email,
        cc: [
          "ahmed.mehmood@itsolutionshub2010.com",
          // "zraja@itsolutionsworldwide.com",
          // "sdevi@itsolutionsworldwide.com",
        ],
        subject: "Uw partneromgeving staat voor u klaar - Asian Spices",
        html: emailHtml,
        text: emailText,
        attachments: brandingAttachments,
        fromAccount: "support",
      });
    }

    return { success: true };
  } catch (error) {
    console.error("[Partner Credentials Email Fail]", error);
    return { success: false, error };
  }
}

// Add this alongside your existing functions in core/email-templates.ts

export async function sendReturnStatusUpdateEmail(returnId: string) {
  try {
    // 1️⃣ Fetch complete return, order, customer and items context
    const returnQuery = await pool.query(
      `SELECT 
        r.id as return_id,
        r.return_number,
        r.status as return_status,
        r.reason as return_reason,
        r.admin_notes,
        o.id as order_id,
        o.order_number,
        COALESCE(
          NULLIF(TRIM(o.customer_email), ''), 
          NULLIF(TRIM(c.email), ''), 
          NULLIF(TRIM(u.email), '')
        ) AS customer_email,
        COALESCE(o.shipping_city, 'uw locatie') as shipping_city,
        COALESCE(
          NULLIF(TRIM(c.first_name), ''),
          NULLIF(TRIM(SPLIT_PART(u.name, ' ', 1)), ''),
          NULLIF(TRIM(oe.metadata->'customer'->>'firstName'), ''),
          NULLIF(TRIM(SPLIT_PART(oe.metadata->'customer'->>'name', ' ', 1)), ''),
          NULLIF(TRIM(oe.metadata->>'firstName'), ''),
          NULLIF(TRIM(SPLIT_PART(oe.metadata->>'name', ' ', 1)), ''),
          NULLIF(TRIM(SPLIT_PART(oe.metadata->>'customer_name', ' ', 1)), ''),
          NULLIF(TRIM(c.last_name), '')
        ) AS first_name,
        COALESCE(
          NULLIF(TRIM(c.last_name), ''),
          NULLIF(TRIM(SUBSTRING(u.name FROM POSITION(' ' IN u.name) + 1)), ''),
          NULLIF(TRIM(oe.metadata->'customer'->>'lastName'), ''),
          NULLIF(TRIM(oe.metadata->>'lastName'), '')
        ) AS last_name,
        COALESCE(
          json_agg(
            json_build_object(
              'name', COALESCE(p.name, 'Product'),
              'sku', p.sku,
              'quantity', ri.quantity,
              'price', COALESCE(oi.price, 0),
              'image_url', COALESCE(md.file_url, CASE WHEN pi.url ~ '^https?://' THEN pi.url ELSE NULL END)
            )
          ) FILTER (WHERE ri.id IS NOT NULL),
          '[]'::json
        ) as return_items
       FROM store_order_returns r
       JOIN store_orders o ON o.id = r.order_id
       LEFT JOIN store_customers c ON (o.customer_id = c.id OR (o.customer_email IS NOT NULL AND LOWER(c.email) = LOWER(o.customer_email)))
       LEFT JOIN users u ON (c.user_id = u.id OR (o.customer_email IS NOT NULL AND LOWER(u.email) = LOWER(o.customer_email)))
       LEFT JOIN LATERAL (
         SELECT metadata
         FROM order_events
         WHERE order_id = o.id AND (event_type = 'created' OR metadata->>'customer' IS NOT NULL)
         ORDER BY id ASC
         LIMIT 1
       ) oe ON true
       LEFT JOIN store_order_return_items ri ON ri.return_id = r.id
       LEFT JOIN store_order_items oi ON oi.order_id = o.id AND oi.product_id = ri.product_id
       LEFT JOIN store_products p ON p.id = ri.product_id
       LEFT JOIN (
         SELECT DISTINCT ON (pi_sub.product_id) 
           pi_sub.product_id, 
           pi_sub.url
         FROM store_product_images pi_sub
         ORDER BY pi_sub.product_id, pi_sub.is_primary DESC, pi_sub.id ASC
       ) pi ON pi.product_id = p.id
       LEFT JOIN media md ON md.media_id = CASE WHEN pi.url ~ '^[0-9]+$' THEN pi.url::int ELSE NULL END
       WHERE r.id = $1
       GROUP BY r.id, o.id, o.order_number, o.customer_email, c.email, u.email, u.name, o.shipping_city, c.first_name, c.last_name, oe.metadata;`,
      [returnId],
    );

    if (returnQuery.rowCount === 0) {
      return { success: false, error: "Return event context missing" };
    }

    const data = returnQuery.rows[0];
    const recipientEmail = data.customer_email?.trim();
    if (!recipientEmail) {
      console.error(`[Email Skipped] Return ${returnId} has no customer_email`);
      return { success: false, error: "Customer email missing" };
    }

    const status = data.return_status;
    let rawFirstName = (data.first_name || "").trim();
    if (rawFirstName && (rawFirstName.toLowerCase() === 'klant' || rawFirstName.includes('{{'))) {
      rawFirstName = "";
    }
    let firstName = rawFirstName
      ? rawFirstName.charAt(0).toUpperCase() + rawFirstName.slice(1)
      : "";

    const rawItems: any[] = Array.isArray(data.return_items) ? data.return_items : [];
    const brandingAttachments = getEmailBrandingAttachments();

    let emailHtml = "";
    let emailText = "";
    let subject = "";

    if (status === "pending") {
      // 🟢 Return Request Confirmed (Initial registration)
      const confirmationItems: ReturnItem[] = rawItems.map((it: any) => ({
        name: it.name || "Product",
        sku: it.sku || undefined,
        quantity: Number(it.quantity || 1),
        imageUrl: it.image_url || undefined,
        reason: data.return_reason || undefined,
      }));

      emailHtml = generateReturnConfirmationEmailHtml({
        orderNumber: data.order_number,
        returnNumber: data.return_number,
        firstName,
        lastName: data.last_name || undefined,
        barcodeNumber: data.return_number,
        items: confirmationItems.length > 0 ? confirmationItems : undefined,
        supportEmail: "support@asianspices.online",
        phoneNumber: "06 44844844",
      });

      emailText = generateReturnConfirmationEmailText({
        orderNumber: data.order_number,
        returnNumber: data.return_number,
        firstName,
        lastName: data.last_name || undefined,
        barcodeNumber: data.return_number,
        items: confirmationItems.length > 0 ? confirmationItems : undefined,
        supportEmail: "support@asianspices.online",
        phoneNumber: "06 44844844",
      });

      subject = `Bevestiging retouraanvraag #${data.order_number} (Retour: ${data.return_number}) - Asian Spices`;
    } else if (
      status === "approved" ||
      status === "item_received" ||
      status === "processed"
    ) {
      // 🟢 Return Processed / Approved
      let calculatedTotal = 0;
      const processedItems: ProcessedReturnItem[] = rawItems.map((it: any) => {
        const qty = Number(it.quantity || 1);
        const price = Number(it.price || 0);
        const itemTotal = price * qty;
        calculatedTotal += itemTotal;
        return {
          name: it.name || "Product",
          sku: it.sku || undefined,
          quantity: qty,
          amount: itemTotal.toFixed(2),
          imageUrl: it.image_url || undefined,
        };
      });

      const totalRefundAmountStr = calculatedTotal > 0 ? calculatedTotal.toFixed(2) : "0.00";

      emailHtml = generateReturnProcessedEmailHtml({
        orderNumber: data.order_number,
        firstName,
        lastName: data.last_name || undefined,
        customerFeedback: data.return_reason || data.admin_notes || undefined,
        items: processedItems.length > 0 ? processedItems : undefined,
        totalRefundAmount: totalRefundAmountStr,
        supportEmail: "support@asianspices.online",
        phoneNumber: "06 44844844",
      });

      emailText = generateReturnProcessedEmailText({
        orderNumber: data.order_number,
        firstName,
        lastName: data.last_name || undefined,
        customerFeedback: data.return_reason || data.admin_notes || undefined,
        items: processedItems.length > 0 ? processedItems : undefined,
        totalRefundAmount: totalRefundAmountStr,
        supportEmail: "support@asianspices.online",
        phoneNumber: "06 44844844",
      });

      subject = `Retourzending verwerkt #${data.order_number} (Retour: ${data.return_number}) - Asian Spices`;
    } else if (status === "rejected") {
      // 🔴 Return Request Rejected
      const reasonHtml = data.admin_notes
        ? `<p style="margin: 0; color: #18181b;"><strong>Toelichting:</strong> ${escapeEmailText(data.admin_notes)}</p>`
        : `<p style="margin: 0; color: #18181b;">Helaas voldoet de aanvraag niet aan onze retourvoorwaarden.</p>`;

      emailHtml = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <title>Update over uw retouraanvraag - Asian Spices</title>
</head>
<body style="margin: 0; padding: 20px 0; background-color: #f4f4f5; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, Arial, sans-serif;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e4e4e7;">
          <tr>
            <td style="padding: 28px 32px; text-align: center; border-bottom: 1px solid #f4f4f5;">
              <img src="cid:as-logo" alt="Asian Spices" width="120" style="display: block; margin: 0 auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <div style="display: inline-block; background-color: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 12px; border-radius: 9999px; margin-bottom: 16px;">
                Retouraanvraag Afgewezen
              </div>
              <h1 style="margin: 0 0 12px 0; font-size: 22px; color: #18181b;">Beste ${firstName},</h1>
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 22px; color: #52525b;">
                Wij hebben uw retouraanvraag voor bestelling <strong>#${data.order_number}</strong> (Retourreferentie: <strong>${data.return_number}</strong>) beoordeeld. Helaas kunnen wij deze aanvraag op dit moment niet goedkeuren.
              </p>
              <div style="background-color: #fff7ed; border-left: 4px solid #ea580c; padding: 14px 16px; border-radius: 6px; margin: 20px 0; font-size: 13px;">
                ${reasonHtml}
              </div>
              <p style="margin: 16px 0 0 0; font-size: 13px; line-height: 20px; color: #71717a;">
                Heeft u hier vragen over of denkt u dat dit een vergissing is? Neem gerust contact met ons op via <a href="mailto:support@asianspices.online" style="color: #ea580c; text-decoration: underline;">support@asianspices.online</a> onder vermelding van uw retournummer.
              </p>
            </td>
          </tr>
          ${renderEmailSocialFooter({
        signoffText: 'Met vriendelijke groet,<br /><strong style="color: #18181b; font-weight: 800;">Het Asian Spices Team</strong>',
        subtext: 'Asian Spices &middot; Uw specialist in authentieke specerijen & ingrediënten.',
      })}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      emailText = `ASIAN SPICES - RETOURAANVRAAG UPDATE
==================================================

Beste ${firstName},

Wij hebben uw retouraanvraag voor bestelling #${data.order_number} (Retourreferentie: ${data.return_number}) beoordeeld.
Helaas kunnen wij deze aanvraag op dit moment niet goedkeuren.

${data.admin_notes ? `Toelichting: ${data.admin_notes}` : "Helaas voldoet de aanvraag niet aan onze retourvoorwaarden."}

Heeft u vragen? Neem contact met ons op via support@asianspices.online onder vermelding van uw retournummer.

Met vriendelijke groet,
Het team van Asian Spices
`;

      subject = `Update over uw retouraanvraag #${data.order_number} (Retour: ${data.return_number}) - Asian Spices`;
    } else {
      // Fallback update
      subject = `Statusupdate retourzending #${data.order_number} - Asian Spices`;
      emailHtml = generateReturnConfirmationEmailHtml({
        orderNumber: data.order_number,
        returnNumber: data.return_number,
        firstName,
        lastName: data.last_name || undefined,
        barcodeNumber: data.return_number,
        supportEmail: "support@asianspices.online",
      });
      emailText = `Statusupdate retourzending #${data.order_number} (Retour: ${data.return_number}): ${status}`;
    }

    try {
      await sendEmail({
        to: recipientEmail,
        cc: ["sales@asianspices.online", "order@asianspices.online"],
        subject,
        html: emailHtml,
        text: emailText,
        attachments: brandingAttachments,
        fromAccount: "order",
      });
    } catch (orderProfileError) {
      console.warn("Return email failed via 'order' profile, falling back to 'support':", orderProfileError);
      await sendEmail({
        to: recipientEmail,
        cc: ["sales@asianspices.online", "order@asianspices.online"],
        subject,
        html: emailHtml,
        text: emailText,
        attachments: brandingAttachments,
        fromAccount: "support",
      });
    }

    return { success: true };
  } catch (error) {
    console.error(
      `[Return Email Dispatch Crash] Identifier Reference: ${returnId}`,
      error,
    );
    return { success: false, error };
  }
}


export async function sendPasswordResetEmail({ email, otp, token, firstName }: PasswordResetEmailOptions) {
  const resetCode = (otp || token || "").trim();
  const greeting = firstName?.trim() ? `Hello ${escapeEmailText(firstName.trim())},` : "Hello,";
  const greetingText = firstName?.trim() ? `Hello ${firstName.trim()},` : "Hello,";

  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; padding: 25px; border-radius: 12px; color: #1f2937; line-height: 1.6;">
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="background-color: #ea580c15; color: #ea580c; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; padding: 6px 14px; display: inline-block; border-radius: 9999px; border: 1px solid #ea580c30;">
          Account Verification
        </span>
      </div>

      <h2 style="color: #111827; text-align: center; margin-top: 10px; margin-bottom: 20px; font-size: 24px; font-weight: 800;">
        Your Verification Code
      </h2>

      <p>${greeting}</p>
      <p>We received a request to update access for your <strong>Asian Spices</strong> account. Use this verification code on the reset password page:</p>

      <div style="text-align: center; margin: 30px 0;">
        <span style="display: inline-block; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px 28px; font-size: 32px; font-weight: 800; letter-spacing: 0.35em; color: #ea580c;">
          ${resetCode}
        </span>
      </div>

      <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 13px; color: #4b5563;">
        <p style="margin: 0 0 8px 0;">This code expires in 15 minutes.</p>
        <p style="margin: 0;">Go to the Asian Spices website, open <strong>Reset Password</strong>, and enter your email with this code.</p>
      </div>

      <p style="font-size: 14px; color: #6b7280; margin-top: 25px;">
        If you didn't request this, you can ignore this email — your password won't be changed.
      </p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;" />
      <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
        © 2026 Asian Spices Online. All rights reserved.<br>
        Need help? Contact us at support@asianspices.online
      </p>
    </div>
  `;

  const emailText = `Your Asian Spices verification code

${greetingText}

We received a request to update access for your Asian Spices account.

Your verification code: ${resetCode}

This code expires in 15 minutes.

Go to the Asian Spices website, open Reset Password, and enter your email with this code.

If you didn't request this, you can ignore this email — your password won't be changed.

Need help? Contact us at support@asianspices.online
© 2026 Asian Spices Online. All rights reserved.`;

  try {
    await sendEmail({
      to: email,
      subject: "Your Asian Spices verification code",
      html: emailHtml,
      text: emailText,
      fromAccount: "support",
    });

    return { success: true };
  } catch (error) {
    console.error(`[Password Reset Email Fail] Target recipient: ${email}`, error);
    return { success: false, error };
  }
}

export async function sendGuestAccountCreatedEmail({
  email,
  password,
  firstName,
}: GuestAccountCreatedEmailOptions) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://asianspices.online";
  const loginUrl = `${siteUrl.replace(/\/$/, "")}/login`;

  const emailHtml = generateAccountRegistrationEmailHtml({
    firstName,
    email,
    temporaryPassword: password,
    accountType: "Klantaccount",
    loginUrl,
    supportEmail: "support@asianspices.online",
  });

  const emailText = generateAccountRegistrationEmailText({
    firstName,
    email,
    temporaryPassword: password,
    accountType: "Klantaccount",
    loginUrl,
    supportEmail: "support@asianspices.online",
  });

  const brandingAttachments = getEmailBrandingAttachments();

  try {
    const res = await sendEmail({
      to: email,
      subject: "Uw Asian Spices account is aangemaakt",
      html: emailHtml,
      text: emailText,
      attachments: brandingAttachments,
      fromAccount: "order",
    });

    console.log(`[Guest Account Email Sent] Profile [order] to ${email}:`, res);
    return { success: true, profile: "order", messageId: (res as any)?.messageId };
  } catch (error: any) {
    console.warn(
      "[Guest Account Email failed via 'order' profile, trying 'partners']:",
      error?.message,
    );
    try {
      const res = await sendEmail({
        to: email,
        subject: "Uw Asian Spices account is aangemaakt",
        html: emailHtml,
        text: emailText,
        attachments: brandingAttachments,
        fromAccount: "partners",
      });
      console.log(`[Guest Account Email Sent] Profile [partners] to ${email}:`, res);
      return { success: true, profile: "partners", messageId: (res as any)?.messageId };
    } catch (partnersError: any) {
      console.warn(
        "[Guest Account Email failed via 'partners' profile, trying 'support']:",
        partnersError?.message,
      );
      try {
        const res = await sendEmail({
          to: email,
          subject: "Uw Asian Spices account is aangemaakt",
          html: emailHtml,
          text: emailText,
          attachments: brandingAttachments,
          fromAccount: "support",
        });
        console.log(`[Guest Account Email Sent] Profile [support] to ${email}:`, res);
        return { success: true, profile: "support", messageId: (res as any)?.messageId };
      } catch (supportError: any) {
        console.error(
          `[Guest Account Email Fail] Target recipient: ${email}`,
          supportError,
        );
        return { success: false, error: supportError };
      }
    }
  }
}

interface AccountWelcomeEmailOptions {
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  accountType?: string;
}

export async function sendAccountWelcomeEmail({
  email,
  name,
  firstName,
  lastName,
  accountType,
}: AccountWelcomeEmailOptions) {
  let resolvedFirstName = firstName?.trim();
  let resolvedLastName = lastName?.trim();
  let resolvedFullName = name?.trim();

  // If names were not passed directly, look them up from DB
  if (!resolvedFirstName && !resolvedFullName) {
    try {
      const userRes = await pool.query(
        `SELECT u.name, c.first_name, c.last_name 
         FROM users u 
         LEFT JOIN store_customers c ON (c.user_id = u.id OR LOWER(c.email) = LOWER(u.email))
         WHERE LOWER(u.email) = LOWER($1) OR LOWER(c.email) = LOWER($1)
         LIMIT 1`,
        [email],
      );
      if (userRes && userRes.rows[0]) {
        const row = userRes.rows[0];
        resolvedFirstName = (row.first_name || (row.name ? row.name.split(' ')[0] : ''))?.trim() || undefined;
        resolvedLastName = (row.last_name || '')?.trim() || undefined;
        resolvedFullName = (row.name || '')?.trim() || undefined;
      }
    } catch { }
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://asianspices.online";
  const loginUrl = `${siteUrl.replace(/\/$/, "")}/login`;

  const emailHtml = generateAccountRegistrationEmailHtml({
    fullName: resolvedFullName,
    firstName: resolvedFirstName,
    lastName: resolvedLastName,
    email,
    accountType: accountType || "Klantaccount",
    loginUrl,
    supportEmail: "support@asianspices.online",
  });

  const emailText = generateAccountRegistrationEmailText({
    fullName: resolvedFullName,
    firstName: resolvedFirstName,
    lastName: resolvedLastName,
    email,
    accountType: accountType || "Klantaccount",
    loginUrl,
    supportEmail: "support@asianspices.online",
  });

  const brandingAttachments = getEmailBrandingAttachments();

  try {
    const res = await sendEmail({
      to: email,
      subject: "Bevestiging registratie account - Asian Spices",
      html: emailHtml,
      text: emailText,
      attachments: brandingAttachments,
      fromAccount: "order",
    });

    console.log(`[Account Welcome Email Sent] Profile [order] to ${email}:`, res);
    return { success: true, profile: "order", messageId: (res as any)?.messageId };
  } catch (error: any) {
    console.warn(
      "[Account Welcome Email failed via 'order' profile, trying 'partners']:",
      error?.message,
    );
    try {
      const res = await sendEmail({
        to: email,
        subject: "Bevestiging registratie account - Asian Spices",
        html: emailHtml,
        text: emailText,
        attachments: brandingAttachments,
        fromAccount: "partners",
      });
      console.log(`[Account Welcome Email Sent] Profile [partners] to ${email}:`, res);
      return { success: true, profile: "partners", messageId: (res as any)?.messageId };
    } catch (partnersError: any) {
      console.warn(
        "[Account Welcome Email failed via 'partners' profile, trying 'support']:",
        partnersError?.message,
      );
      try {
        const res = await sendEmail({
          to: email,
          subject: "Bevestiging registratie account - Asian Spices",
          html: emailHtml,
          text: emailText,
          attachments: brandingAttachments,
          fromAccount: "support",
        });
        console.log(`[Account Welcome Email Sent] Profile [support] to ${email}:`, res);
        return { success: true, profile: "support", messageId: (res as any)?.messageId };
      } catch (fallbackError: any) {
        console.error(
          `[Account Welcome Email Fail] Target recipient: ${email}:`,
          fallbackError?.message || fallbackError,
        );
        return { success: false, error: fallbackError?.message || String(fallbackError) };
      }
    }
  }
}

export async function sendContactFormEmail({
  fullName,
  email,
  subject,
  message,
}: ContactFormEmailOptions) {
  try {
    const safeName = escapeEmailText(fullName);
    const safeEmail = escapeEmailText(email);
    const safeSubject = escapeEmailText(subject);
    const safeMessage = escapeEmailText(message);

    const notificationHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; padding: 25px; border-radius: 12px; color: #1f2937; line-height: 1.6;">
        <h2 style="color: #111827; margin-top: 0; margin-bottom: 8px; font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em;">
          NEW CONTACT FORM SUBMISSION
        </h2>
        <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 14px; line-height: 1.5;">
          A new message has been submitted through the Asian Spices website contact form.
        </p>

        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 12px 0; font-size: 13px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">
            CUSTOMER DETAILS
          </h3>
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #111827;">
            <strong style="color: #4b5563; display: block; font-size: 12px; text-transform: uppercase; margin-bottom: 2px;">Name:</strong>
            ${safeName}
          </p>
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #111827;">
            <strong style="color: #4b5563; display: block; font-size: 12px; text-transform: uppercase; margin-bottom: 2px;">Email:</strong>
            <a href="mailto:${safeEmail}" style="color: #ea580c; text-decoration: underline;">${safeEmail}</a>
          </p>
          <p style="margin: 0; font-size: 14px; color: #111827;">
            <strong style="color: #4b5563; display: block; font-size: 12px; text-transform: uppercase; margin-bottom: 2px;">Subject:</strong>
            ${safeSubject}
          </p>
        </div>

        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0; font-size: 13px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">
            MESSAGE
          </h3>
          <p style="margin: 0; white-space: pre-wrap; font-size: 14px; color: #1f2937; line-height: 1.6;">${safeMessage}</p>
        </div>

        <div style="background-color: #fff7ed; border-left: 4px solid #ea580c; padding: 14px 16px; border-radius: 6px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: #9a3412; text-transform: uppercase; letter-spacing: 0.05em;">
            SUPPORT ACTION
          </h3>
          <p style="margin: 0 0 8px 0; font-size: 13px; color: #7c2d12; line-height: 1.5;">
            Please review the customer's message and respond directly to the customer's email address.
          </p>
          <p style="margin: 0; font-size: 13px; color: #9a3412; font-style: italic; line-height: 1.5;">
            Please respond to customer complaints within 4 hours and general queries within 8 hours of receiving the message.
          </p>
        </div>

        <p style="margin: 0 0 4px 0; font-size: 14px; color: #4b5563;">Regards,</p>
        <p style="margin: 0 0 2px 0; font-size: 14px; font-weight: 700; color: #111827;">Asian Spices Support Team</p>
        <p style="margin: 0; font-size: 14px;">
          <a href="mailto:support@asianspices.online" style="color: #ea580c; text-decoration: none;">support@asianspices.online</a>
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;" />
        <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
          Sent via the Contact Us form on asianspices.online
        </p>
      </div>
    `;

    const notificationText = `NEW CONTACT FORM SUBMISSION

A new message has been submitted through the Asian Spices website contact form.

CUSTOMER DETAILS

Name:
${fullName}

Email:
${email}

Subject:
${subject}

MESSAGE

${message}

SUPPORT ACTION

Please review the customer's message and respond directly to the customer's email address.
* They need to respond within 4 hours for complaints and within 8 hours for general queries.

Regards,
Asian Spices Support Team
support@asianspices.online`;

    await sendEmail({
      to: "support@asianspices.online",
      replyTo: email,
      subject: `New Contact Form Submission – ${subject}`,
      html: notificationHtml,
      text: notificationText,
      fromAccount: "support",
    });

    // Small pause between emails to allow SMTP socket reuse
    await new Promise((r) => setTimeout(r, 300));

    const sendCustomerConfirmation = async () => {
      if (USE_TEMP_PARTNER_CONFIRMATION_EMAIL) {
        // Temporary Partner Verification confirmation email
        const nameParts = (fullName || "").trim().split(/\s+/);
        const lastName =
          nameParts.length > 1 ? nameParts.slice(1).join(" ") : fullName || "Partner";

        const attachments = getEmailBrandingAttachments();

        const partnerHtml = generatePartnerVerificationEmailHtml({
          fullName,
          lastName,
          email,
        });

        const partnerText = generatePartnerVerificationEmailText({
          fullName,
          lastName,
          email,
        });

        await sendEmail({
          to: email,
          subject: "Welkom als goedgekeurde partner - Asian Spices",
          html: partnerHtml,
          text: partnerText,
          attachments,
          fromAccount: "support",
        });
      } else {
        const greetingName = fullName?.trim() ? escapeEmailText(fullName.trim()) : "Klant";
        const brandingAttachments = getEmailBrandingAttachments();

        const confirmationHtml = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <title>We hebben uw bericht ontvangen - Asian Spices</title>
</head>
<body style="margin: 0; padding: 20px 0; background-color: #f4f4f5; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, Arial, sans-serif;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e4e4e7;">
          <tr>
            <td style="padding: 28px 32px; text-align: center; border-bottom: 1px solid #f4f4f5;">
              <img src="cid:as-logo" alt="Asian Spices" width="120" style="display: block; margin: 0 auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <div style="display: inline-block; background-color: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 12px; border-radius: 9999px; margin-bottom: 16px;">
                Bericht Ontvangen
              </div>
              <h1 style="margin: 0 0 12px 0; font-size: 22px; color: #18181b;">Beste ${greetingName},</h1>
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 22px; color: #52525b;">
                Bedankt voor uw bericht aan <strong>Asian Spices</strong>. Ons supportteam heeft uw vraag ontvangen en zal binnen 48 uur contact met u opnemen.
              </p>
              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 16px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #71717a;"><strong>Onderwerp:</strong> <span style="color: #18181b;">${safeSubject}</span></p>
                <p style="margin: 0; font-size: 13px; color: #71717a;"><strong>Uw bericht:</strong></p>
                <p style="margin: 6px 0 0 0; font-size: 13px; color: #18181b; white-space: pre-wrap; line-height: 20px;">${safeMessage}</p>
              </div>
              <p style="margin: 16px 0 0 0; font-size: 12.5px; line-height: 19px; color: #71717a;">
                Dit is een automatische ontvangstbevestiging. U hoeft niet op deze e-mail te reageren; ons team neemt rechtstreeks contact met u op via dit e-mailadres.
              </p>
            </td>
          </tr>
          ${renderEmailSocialFooter({
          signoffText: 'Met vriendelijke groet,<br /><strong style="color: #18181b; font-weight: 800;">Het Asian Spices Support Team</strong>',
          subtext: 'Asian Spices &middot; Uw specialist in authentieke specerijen & ingrediënten.',
        })}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

        const confirmationText = `We hebben uw bericht ontvangen - Asian Spices

Beste ${greetingName},

Bedankt voor uw bericht aan Asian Spices. Ons supportteam heeft uw vraag ontvangen en zal binnen 48 uur contact met u opnemen.

Onderwerp: ${subject}
Uw bericht:
${message}

Dit is een automatische ontvangstbevestiging.

Met vriendelijke groet,
Het Asian Spices Support Team
support@asianspices.online`;

        await sendEmail({
          to: email,
          subject: "We hebben uw bericht ontvangen — Asian Spices",
          html: confirmationHtml,
          text: confirmationText,
          attachments: brandingAttachments,
          fromAccount: "support",
        });
      }
    };

    try {
      await sendCustomerConfirmation();
    } catch (confErr) {
      console.warn("[Customer Confirmation Attempt 1 Failed, Retrying after 1s...]", confErr);
      await new Promise((r) => setTimeout(r, 1000));
      await sendCustomerConfirmation();
    }

    return { success: true };
  } catch (error) {
    console.error("[Contact Form Email Dispatch Failure]", error);
    return { success: false, error };
  }
}

export async function sendNewsletterWelcomeEmail(email: string) {
  try {
    // const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3002";
    const siteUrl = "https://www.asianspices.online/";

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; padding: 25px; border-radius: 12px; color: #1f2937; line-height: 1.6;">
        <div style="text-align: center; margin-bottom: 20px;">
          <span style="background-color: #ea580c15; color: #ea580c; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; padding: 6px 14px; display: inline-block; border-radius: 9999px; border: 1px solid #ea580c30;">
            Newsletter
          </span>
        </div>

        <h2 style="color: #111827; text-align: center; margin-top: 10px; margin-bottom: 20px; font-size: 24px; font-weight: 800;">
          Thanks for Subscribing!
        </h2>

        <p>Hello,</p>
        <p>You have successfully subscribed to the <strong>Asian Spices</strong> newsletter. Thank you for joining our community!</p>
        <p>You'll now receive exclusive recipes, spice tips, special offers, and updates delivered straight to your inbox.</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${siteUrl}" style="background-color: #ea580c; color: #ffffff; text-decoration: none; padding: 12px 24px; font-weight: 600; border-radius: 8px; display: inline-block;">
            Visit Asian Spices
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;" />
        <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
          © 2026 Asian Spices Online. All rights reserved.<br>
          Need help? Contact us at support@asianspices.online
        </p>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: "You subscribed to our newsletter — thank you! 🎉",
      html: emailHtml,
      fromAccount: "support",
    });

    return { success: true };
  } catch (error) {
    console.error(`[Newsletter Welcome Email Fail] Target recipient: ${email}`, error);
    return { success: false, error };
  }
}

export const sendSupportContactEmail = sendContactFormEmail;
export type SupportContactEmailOptions = ContactFormEmailOptions;
