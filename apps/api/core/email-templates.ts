// core/email-templates.ts

import { pool } from "./db";
import { sendEmail } from "./email";

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
  token: string;
}

export async function sendOrderConfirmationEmail(orderId: string) {
  try {
    // 1️⃣ Fetch complete payload variables for the email
    const orderQuery = await pool.query(
      `SELECT order_number, customer_email, total_amount, shipping_provider, shipping_city 
       FROM store_orders WHERE id = $1`,
      [orderId],
    );

    if (orderQuery.rowCount === 0)
      return { success: false, error: "Order context missing" };

    const order = orderQuery.rows[0];
    const deliveryWindow =
      DELIVERY_DAYS_MAP[order.shipping_provider] || "3 - 5 business days";

    // 2️⃣ Build modern HTML Email Structure
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; padding: 20px; border-radius: 12px;">
        <h2 style="color: #ea580c; text-align: center;">Your Flavorful Journey Begins!</h2>
        <p>Hello,</p>
        <p>Thank you for shopping with <strong>Asian Spices</strong>. We are thrilled to confirm that your payment has been processed and your order is officially locked in.</p>
        
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Order Number:</strong> ${order.order_number}</p>
          <p style="margin: 0 0 8px 0;"><strong>Amount Paid:</strong> €${Number(order.total_amount).toFixed(2)}</p>
          <p style="margin: 0 0 8px 0;"><strong>Shipping Choice:</strong> ${order.shipping_provider}</p>
          <p style="margin: 0;"><strong>Estimated Delivery:</strong> ${deliveryWindow}</p>
        </div>

        <p>Our team is currently preparing your parcel for selection and dynamic routing. Once your tracking code registers out of the hub for delivery to <strong>${order.shipping_city}</strong>, we'll send a follow-up link immediately.</p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;" />
        <p style="font-size: 12px; color: #6b7280; text-align: center;">
          © 2026 Asian Spices Online. All rights reserved.<br>
          Need support? Reply directly to this thread or contact us via support@asianspices.online
        </p>
      </div>
    `;

    // 3️⃣ Dispatch
    await sendEmail({
      to: order.customer_email,
      cc: ["sales@asianspices.online", "order@asianspices.online"],
      subject: `Order Confirmed! 🎉 (Ref: ${order.order_number})`,
      html: emailHtml,
      fromAccount: "order",
    });

    return { success: true };
  } catch (error) {
    console.error(
      "Error generating or dispatching order email template:",
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
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; padding: 25px; border-radius: 12px; color: #1f2937;">
        <h2 style="color: #ea580c; text-align: center; margin-bottom: 20px;">Partner Application Received!</h2>
        <p>Dear ${firstName},</p>
        <p>Thank you for submitting your partner store application to join the <strong>Asian Spices</strong> merchant network. We are excited about the prospect of working together to expand your reach.</p>
        
        <p>Your application is currently under review by our super admin onboarding team. You can track the progress of your onboarding file using your unique application ID below:</p>
        
        <div style="background-color: #f9fafb; border-left: 4px solid #ea580c; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0 0 6px 0; font-size: 14px; color: #4b5563;"><strong>Company Name:</strong> ${companyName}</p>
          <p style="margin: 0; font-size: 16px; color: #111827;"><strong>Application Tracking ID:</strong> <code style="background-color: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-weight: bold; color: #ea580c;">${applicationId}</code></p>
        </div>

        <p><strong>What happens next?</strong></p>
        <ul style="padding-left: 20px; line-height: 1.6;">
          <li>Our operations desk will verify your KVK and Chamber of Commerce filings.</li>
          <li>We will check your location parameters to determine optimal localized delivery zones.</li>
          <li>Once approved, you will receive credentials to access your dedicated store manager application portal.</li>
        </ul>

        <p style="margin-top: 25px;">If you have any immediate questions regarding your application compliance documents, please reply directly to this message.</p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;" />
        <p style="font-size: 12px; color: #6b7280; text-align: center; margin: 0;">
          © 2026 Asian Spices Merchant Network. All rights reserved.<br>
          This is an automated tracking update from your vendor portal.
        </p>
      </div>
    `;

    await sendEmail({
      to: email,
      cc: ["partners@asianspices.online"],
      subject: `Your Asian Spices Partner Application - ${applicationId}`,
      html: emailHtml,
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

// Add this alongside your existing functions in core/email-templates.ts

export async function sendReturnStatusUpdateEmail(returnId: string) {
  try {
    // 1️⃣ Fetch complete payload variables for the tracking event
    const returnQuery = await pool.query(
      `SELECT 
        r.id as return_id,
        r.return_number,
        r.status as return_status,
        r.reason as return_reason,
        r.admin_notes,
        o.order_number,
        o.customer_email,
        COALESCE(o.shipping_city, 'your location') as shipping_city,
        json_agg(
          json_build_object(
            'name', p.name,
            'quantity', ri.quantity
          )
        ) as return_items
       FROM store_order_returns r
       JOIN store_orders o ON o.id = r.order_id
       JOIN store_order_return_items ri ON ri.return_id = r.id
       JOIN products p ON p.id = ri.product_id
       WHERE r.id = $1
       GROUP BY r.id, o.order_number, o.customer_email, o.shipping_city;`,
      [returnId],
    );

    if (returnQuery.rowCount === 0) {
      return { success: false, error: "Return event context missing" };
    }

    const data = returnQuery.rows[0];
    const status = data.return_status;

    // 2️⃣ Define Context Variables Based on Current Workflow Status
    let statusLabel = "";
    let statusColor = "#ea580c"; // Default Orange
    let heroMessage = "";
    let introductionText = "";
    let instructionalBlock = "";

    switch (status) {
      case "pending":
        statusLabel = "Return Request Received";
        statusColor = "#d97706"; // Amber
        heroMessage = "We've Logged Your Request";
        introductionText = `We have received your return request for order <strong>#${data.order_number}</strong>. Our backend operations desk is currently auditing the details.`;
        instructionalBlock = `
          <div style="background-color: #fffbeb; border-left: 4px solid #d97706; padding: 15px; border-radius: 6px; margin: 20px 0; font-size: 14px; color: #b45309;">
            <strong>What's next?</strong> You don't need to do anything yet! We will notify you via email as soon as a platform admin reviews and approves your shipping arrangements.
          </div>
        `;
        break;

      case "approved":
        statusLabel = "Return Approved & Routed";
        statusColor = "#2563eb"; // Blue
        heroMessage = "Your Return is Approved!";
        introductionText = `Great news! Your return request under reference <strong>${data.return_number}</strong> has been approved. The individual fulfillment stores are prepared for your arrival package.`;
        instructionalBlock = `
          <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 15px; border-radius: 6px; margin: 20px 0; font-size: 14px; color: #1d4ed8;">
            <strong>Shipping Instructions:</strong><br>
            1. Package the items safely with their original tags and container cards.<br>
            2. Drop your parcel off at your closest regional transit point or courier box.<br>
            3. Use the return identification voucher token inside your user profile dashboard.
          </div>
        `;
        break;

      case "rejected":
        statusLabel = "Return Request Declined";
        statusColor = "#dc2626"; // Red
        heroMessage = "Update on Your Return Request";
        introductionText = `We are writing to let you know that your return request for order <strong>#${data.order_number}</strong> could not be approved at this time.`;

        const noteExcerpt = data.admin_notes
          ? `<p style="margin: 5px 0 0 0; font-style: italic;">"${data.admin_notes}"</p>`
          : `<p style="margin: 5px 0 0 0;">Please check your dashboard for additional details.</p>`;
        instructionalBlock = `
          <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; border-radius: 6px; margin: 20px 0; font-size: 14px; color: #991b1b;">
            <strong>Review Reason Given:</strong>
            ${noteExcerpt}
          </div>
        `;
        break;

      case "item_received":
        statusLabel = "Items Safely Returned";
        statusColor = "#16a34a"; // Green
        heroMessage = "Parcel Received & Verified!";
        introductionText = `We've successfully verified the delivery of your package for return reference <strong>${data.return_number}</strong> back at our fulfillment desks.`;
        instructionalBlock = `
          <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; border-radius: 6px; margin: 20px 0; font-size: 14px; color: #166534;">
            <strong>Next Steps:</strong> Our finance pipeline has been flagged automatically. A credit reconciliation transfer for these items will settle back into your original account wallet configuration within 3-5 business days.
          </div>
        `;
        break;

      default:
        statusLabel = `Return Status Update: ${status}`;
        heroMessage = "Return Progress Alert";
        introductionText = `Your return file status update progress indicator has moved to: <strong>${status}</strong>.`;
    }

    // 3️⃣ Construct Dynamic Line-Item Rows
    let itemsTableRows = "";
    if (Array.isArray(data.return_items)) {
      data.return_items.forEach((item: any) => {
        itemsTableRows += `
          <tr>
            <td style="padding: 10px 0; border-b: 1px solid #f3f4f6; color: #374151;">${item.name}</td>
            <td style="padding: 10px 0; border-b: 1px solid #f3f4f6; text-align: right; color: #111827; font-weight: bold;">${item.quantity}x</td>
          </tr>
        `;
      });
    }

    // 4️⃣ Build the HTML Layout
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; padding: 25px; border-radius: 12px; color: #1f2937; line-height: 1.5;">
        <div style="text-align: center; margin-bottom: 20px;">
          <span style="background-color: ${statusColor}15; color: ${statusColor}; px-3; py-1; border-radius: 9999px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; padding: 6px 14px; display: inline-block; border: 1px solid ${statusColor}30;">
            ${statusLabel}
          </span>
        </div>
        
        <h2 style="color: #111827; text-align: center; margin-top: 10px; margin-bottom: 20px; font-size: 24px; font-weight: 800; tracking-tight: -0.025em;">
          ${heroMessage}
        </h2>
        
        <p style="color: #4b5563; font-size: 15px;">Hello,</p>
        <p style="color: #4b5563; font-size: 15px;">${introductionText}</p>
        
        ${instructionalBlock}

        <div style="margin-top: 25px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px 20px; background-color: #fafafa;">
          <h4 style="margin: 0 0 12px 0; color: #111827; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Filing Manifest Details</h4>
          <p style="margin: 0 0 6px 0; font-size: 13px; color: #6b7280;">Return Token: <span style="font-family: monospace; font-weight: bold; color: #111827;">${data.return_number}</span></p>
          <p style="margin: 0 0 12px 0; font-size: 13px; color: #6b7280;">Stated Reason: <span style="color: #111827; font-medium">${data.return_reason}</span></p>
          
          <table style="w-full; border-collapse: collapse; font-size: 14px; width: 100%; border-top: 1px dashed #e5e7eb; margin-top: 10px;">
            <thead>
              <tr>
                <th style="text-align: left; padding: 10px 0; color: #6b7280; font-weight: 500; font-size: 12px;">Product Title</th>
                <th style="text-align: right; padding: 10px 0; color: #6b7280; font-weight: 500; font-size: 12px;">Qty</th>
              </tr>
            </thead>
            <tbody>
              ${itemsTableRows}
            </tbody>
          </table>
        </div>

        <p style="margin-top: 25px; font-size: 14px; color: #6b7280;">
          If you have any questions or require modifications regarding this reverse dispatch, please reply to this support message thread.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;" />
        <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
          © 2026 Asian Spices Operations Hub. All rights reserved.<br>
          Automated processing trace notification update pipeline context.
        </p>
      </div>
    `;

    // 5️⃣ Dispatch to Customer via SMTP
    await sendEmail({
      to: data.customer_email,
      cc: ["sales@asianspices.online", "order@asianspices.online"],
      subject: `[${statusLabel}] Return Update Ref: ${data.return_number}`,
      html: emailHtml,
      fromAccount: "order",
    });

    return { success: true };
  } catch (error) {
    console.error(
      `[Return Email Dispatch Crash] Identifier Reference: ${returnId}`,
      error,
    );
    return { success: false, error };
  }
}


export async function sendPasswordResetEmail({ email, token }: PasswordResetEmailOptions) {
  try {
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; padding: 25px; border-radius: 12px; color: #1f2937; line-height: 1.6;">
        <div style="text-align: center; margin-bottom: 20px;">
          <span style="background-color: #ea580c15; color: #ea580c; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; padding: 6px 14px; display: inline-block; border-radius: 9999px; border: 1px solid #ea580c30;">
            Security Notification
          </span>
        </div>

        <h2 style="color: #111827; text-align: center; margin-top: 10px; margin-bottom: 20px; font-size: 24px; font-weight: 800;">
          Reset Your Password
        </h2>
        
        <p>Hello,</p>
        <p>We received a request to reset the password for your <strong>Asian Spices</strong> account. Use the OTP code below in the app:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <div style="background-color: #fff7ed; border: 1px solid #fdba74; color: #ea580c; font-size: 32px; font-weight: 800; letter-spacing: 8px; padding: 18px 24px; border-radius: 12px; display: inline-block;">
            ${token}
          </div>
        </div>

        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 13px; color: #4b5563;">
          <p style="margin: 0 0 8px 0;"><strong>Code Lifespan:</strong> This OTP expires in 1 hour for your security.</p>
          <p style="margin: 0;">Enter this code in the app along with your new password to finish resetting your account.</p>
        </div>

        <p style="font-size: 14px; color: #6b7280; margin-top: 25px;">
          If you did not request a password reset, you can safely ignore this email.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;" />
        <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
          © 2026 Asian Spices Security Desk. All rights reserved.<br>
          Need support? Contact us via support@asianspices.online
        </p>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: "Your Asian Spices password reset code",
      html: emailHtml,
      fromAccount: "support",
    });

    return { success: true };
  } catch (error) {
    console.error(`[Forgot Password Email Fail] Target recipient: ${email}`, error);
    return { success: false, error };
  }
}

interface SupportContactEmailOptions {
  fullName: string;
  email: string;
  subject: string;
  message: string;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendSupportContactEmail({
  fullName,
  email,
  subject,
  message,
}: SupportContactEmailOptions) {
  try {
    const safeName = escapeHtml(fullName);
    const safeEmail = escapeHtml(email);
    const safeSubject = escapeHtml(subject);
    const safeMessage = escapeHtml(message).replace(/\n/g, "<br />");

    const supportInbox =
      process.env.SUPPORT_INBOX_EMAIL || "support@asianspices.online";

    const teamEmailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; padding: 25px; border-radius: 12px; color: #1f2937; line-height: 1.6;">
        <div style="text-align: center; margin-bottom: 20px;">
          <span style="background-color: #ea580c15; color: #ea580c; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; padding: 6px 14px; display: inline-block; border-radius: 9999px; border: 1px solid #ea580c30;">
            Support Request
          </span>
        </div>

        <h2 style="color: #111827; text-align: center; margin-top: 10px; margin-bottom: 20px; font-size: 24px; font-weight: 800;">
          New Help & Support Message
        </h2>

        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Name:</strong> ${safeName}</p>
          <p style="margin: 0 0 8px 0;"><strong>Email:</strong> ${safeEmail}</p>
          <p style="margin: 0;"><strong>Subject:</strong> ${safeSubject}</p>
        </div>

        <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; background-color: #ffffff;">
          <p style="margin: 0 0 8px 0; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Message</p>
          <p style="margin: 0; color: #374151; white-space: pre-wrap;">${safeMessage}</p>
        </div>

        <p style="font-size: 13px; color: #6b7280; margin-top: 20px;">
          Reply directly to this email to respond to the customer.
        </p>
      </div>
    `;

    await sendEmail({
      to: supportInbox,
      subject: `[Support] ${subject}`,
      html: teamEmailHtml,
      fromAccount: "support",
      replyTo: email,
    });

    const customerEmailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; padding: 25px; border-radius: 12px; color: #1f2937; line-height: 1.6;">
        <div style="text-align: center; margin-bottom: 20px;">
          <span style="background-color: #ea580c15; color: #ea580c; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; padding: 6px 14px; display: inline-block; border-radius: 9999px; border: 1px solid #ea580c30;">
            Support
          </span>
        </div>

        <h2 style="color: #111827; text-align: center; margin-top: 10px; margin-bottom: 20px; font-size: 24px; font-weight: 800;">
          We Received Your Message
        </h2>

        <p>Hello ${safeName},</p>
        <p>Thank you for contacting <strong>Asian Spices</strong> support. We have received your message regarding <strong>${safeSubject}</strong>.</p>
        <p>Our team will review your request and respond within 48 hours.</p>

        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Your Message</p>
          <p style="margin: 0; color: #374151; white-space: pre-wrap;">${safeMessage}</p>
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
      subject: "We received your support message — Asian Spices",
      html: customerEmailHtml,
      fromAccount: "support",
    });

    return { success: true };
  } catch (error) {
    console.error(`[Support Contact Email Fail] From: ${email}`, error);
    return { success: false, error };
  }
}

export async function sendNewsletterWelcomeEmail(email: string) {
  try {
    // const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3002";
    const siteUrl ="https://www.asianspices.online/";

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