// app/api/account/orders/[id]/invoice/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { webAuthOptions } from "@/core/auth";
import { pool } from "@/core/db";
import { jsPDF } from "jspdf";
import fs from "fs";
import path from "path";

function euro(value: number | string | null | undefined) {
  return `€ ${Number(value || 0).toFixed(2)}`;
}

function prettyDate(value: any) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function loadAsianSpicesLogo() {
  try {
    const logoPath = path.join(
      process.cwd(),
      "public",
      "assets",
      "logo",
      "Group 87.png",
    );
    const base64 = fs.readFileSync(logoPath).toString("base64");
    return `data:image/png;base64,${base64}`;
  } catch {
    return null;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(webAuthOptions);

  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orderId = id;
  const client = await pool.connect();

  try {
    // 1. Fetch order details and verify ownership and payment status
    const orderQuery = `
      SELECT o.*,
        json_agg(
          json_build_object(
            'title', p.name,
            'price', oi.price,
            'quantity', oi.quantity
          )
        ) AS cart_items,
        json_agg(
          json_build_object(
            'company_name', c.company_name,
            'customer_name', c.first_name || ' ' || c.last_name,
            'email', c.email,
            'phone', c.phone,
            'city', c.city,
            'postcode', c.postcode
          )
        ) AS customer_info
      FROM store_orders o
      LEFT JOIN store_order_items oi ON oi.order_id = o.id
      LEFT JOIN store_products p ON oi.product_id = p.id
      LEFT JOIN store_customers c ON c.id = o.customer_id
      WHERE o.id = $1 
      GROUP BY o.id
    `; // AND c.user_id = $2

    const { rows } = await client.query(orderQuery, [orderId]); // , session.user.id
    const order = rows[0];

    // console.log('order details ==== ',order);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 🛑 Security Gate: Enforce invoice creation only for paid orders
    if (order.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Invoices are only available for paid transactions." },
        { status: 403 },
      );
    }

    // 🚀 IN-MEMORY PDF GENERATION (Immune to Next.js bundling paths bugs)
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });

    // --- PDF DESIGN LAYOUT (format-only update to match provided invoice style) ---
    const LEFT = 50;
    const RIGHT = 545;
    const topY = 42;

    const subtotalAmount = Number(order.subtotal || 0);
    const shippingAmount = Number(order.shipping_amount || 0);
    const taxAmount = Number(order.tax_amount || 0);
    const totalAmount = Number(order.total_amount || 0);
    const exclVatAmount = subtotalAmount - taxAmount;
    const vatPct =
      exclVatAmount > 0 ? Math.round((taxAmount / exclVatAmount) * 100) : 21;

    const customerName = order.customer_info[0]?.customer_name || "Valued Customer";
    const shippingLine = [order.shipping_postal_code, order.shipping_city]
      .filter(Boolean)
      .join(" ");
    const currency = order.currency || order.currency_code || "EUR";
    const paymentMethod = order.payment_method
      ? String(order.payment_method).toUpperCase()
      : "-";
    const paymentStatus = String(order.payment_status || "").toUpperCase();

    // Header left: logo
    const logoData = loadAsianSpicesLogo();
    if (logoData) {
      try {
        const props = doc.getImageProperties(logoData);
        let logoW = 120;
        let logoH = (props.height / props.width) * logoW;
        const maxH = 70;
        if (logoH > maxH) {
          logoH = maxH;
          logoW = (props.width / props.height) * maxH;
        }
        doc.addImage(logoData, "PNG", LEFT, topY, logoW, logoH);
      } catch {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor("#111827");
        doc.text("ASIAN SPICES", LEFT, topY + 28);
      }
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor("#111827");
      doc.text("ASIAN SPICES", LEFT, topY + 28);
    }

    // Header right: company block
    doc.setTextColor("#111827");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Asian Spices Online B.V.", RIGHT, topY + 14, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text("Mandenmakerstraat 100C", RIGHT, topY + 28, { align: "right" });
    doc.text("3194 DG Hoogvliet Rotterdam", RIGHT, topY + 41, { align: "right" });
    doc.text("The Netherlands", RIGHT, topY + 54, { align: "right" });
    doc.text("VAT: NL869440317B01", RIGHT, topY + 82, { align: "right" });
    doc.text("CoC: 42041922", RIGHT, topY + 95, { align: "right" });

    // Horizontal divider
    doc.setDrawColor("#111827");
    doc.setLineWidth(2);
    doc.line(LEFT, 150, RIGHT, 150);

    // Invoice title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(40);
    doc.setTextColor("#111827");
    doc.text("INVOICE", LEFT, 188);

    // Bill To block
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("Bill To", LEFT, 214);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor("#374151");
    let billY = 236;
    [
      customerName,
      order.shipping_address_line1,
      order.shipping_address_line2,
      shippingLine,
      order.shipping_country,
    ]
      .filter((line) => line && String(line).trim().length > 0)
      .forEach((line) => {
        doc.text(String(line), LEFT, billY);
        billY += 14;
      });

    // Meta table (right side)
    const metaLabelX = 350;
    const metaValueX = RIGHT;
    let metaY = 214;
    const metaRows: [string, string][] = [
      ["Invoice Number", `#${order.order_number}`],
      ["Invoice Date", prettyDate(order.created_at)],
      ["Order Date", prettyDate(order.created_at)],
      ["Order Number", `#${order.order_number}`],
      ["Payment Method", paymentMethod],
      ["Payment Status", paymentStatus || "PAID"],
      ["Currency", currency],
    ];

    metaRows.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor("#111827");
      doc.text(label, metaLabelX, metaY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(label === "Payment Status" ? "#16A34A" : "#374151");
      doc.text(value, metaValueX, metaY, { align: "right" });
      metaY += 17;
    });

    // Table header area
    const colNo = 62;
    const colArticle = 78;
    const colQty = 320;
    const colUnit = 410;
    const colVat = 460;
    const colIncl = RIGHT;
    let currentY = Math.max(billY, metaY) + 20;

    doc.setFillColor(243, 244, 246);
    doc.rect(LEFT, currentY, RIGHT - LEFT, 22, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor("#111827");
    doc.text("#", colNo, currentY + 15);
    doc.text("Article", colArticle, currentY + 15);
    doc.text("Quantity", colQty, currentY + 15, { align: "right" });
    doc.text("Price per unit", colUnit, currentY + 15, { align: "right" });
    doc.text("VAT", colVat, currentY + 15, { align: "right" });
    doc.text("Price incl. VAT", colIncl, currentY + 15, { align: "right" });

    currentY += 22;

    const validItems = Array.isArray(order.cart_items)
      ? order.cart_items.filter((i: any) => i && i.title)
      : [];

    // Loop through invoice item records
    validItems.forEach((item: any, index: number) => {
      currentY += 20;
      doc.setFont("helvetica", "normal");
      doc.setTextColor("#374151");

      const qty = Number(item.quantity || 0);
      const unit = Number(item.price || 0);
      const lineTotal = qty * unit;

      doc.text(String(index + 1), colNo, currentY);
      doc.text(item.title.substring(0, 42), colArticle, currentY);
      doc.text(qty.toString(), colQty, currentY, { align: "right" });
      doc.text(euro(unit), colUnit, currentY, { align: "right" });
      doc.text(`${vatPct}%`, colVat, currentY, { align: "right" });
      doc.text(euro(lineTotal), colIncl, currentY, { align: "right" });

      // Horizontal separation borders
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.5);
      doc.line(LEFT, currentY + 7, RIGHT, currentY + 7);
      currentY += 6;
    });

    // Summary section (left + right boxes style)
    const sumTop = currentY + 42;

    // Left VAT summary
    const leftLabelX = LEFT + 12;
    const leftAmountX = 210;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor("#374151");
    doc.text("Excl. VAT", leftLabelX, sumTop);
    doc.text(euro(exclVatAmount), leftAmountX, sumTop, { align: "right" });

    doc.text(`VAT ${vatPct}%`, leftLabelX, sumTop + 20);
    doc.text(euro(taxAmount), leftAmountX, sumTop + 20, { align: "right" });

    doc.setDrawColor(209, 213, 219);
    doc.setLineWidth(0.7);
    doc.line(LEFT + 10, sumTop + 30, leftAmountX, sumTop + 30);

    doc.setTextColor("#111827");
    doc.setFont("helvetica", "bold");
    doc.text("Total", leftLabelX, sumTop + 46);
    doc.text(euro(subtotalAmount), leftAmountX, sumTop + 46, {
      align: "right",
    });

    // Right payment summary
    const rightLabelX = 380;
    const rightAmountX = RIGHT;
    doc.setFont("helvetica", "normal");
    doc.setTextColor("#374151");
    doc.text("Subtotal (incl. VAT)", rightLabelX, sumTop);
    doc.text(euro(subtotalAmount), rightAmountX, sumTop, { align: "right" });

    doc.text("Shipping (Standard)", rightLabelX, sumTop + 20);
    doc.text(euro(shippingAmount), rightAmountX, sumTop + 20, {
      align: "right",
    });

    doc.setDrawColor("#111827");
    doc.setLineWidth(0.8);
    doc.line(rightLabelX, sumTop + 30, RIGHT, sumTop + 30);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor("#111827");
    doc.text("Total", rightLabelX, sumTop + 48);
    doc.text(euro(totalAmount), rightAmountX, sumTop + 48, { align: "right" });

    // Footer strip (line + contact details)
    const footerLineY = 770;
    const footerTextY = 788;
    const footerCenterX = (LEFT + RIGHT) / 2;
    doc.setDrawColor("#111827");
    doc.setLineWidth(1.2);
    doc.line(LEFT, footerLineY, RIGHT, footerLineY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor("#111827");
    const emailText = "finance@asianspices.com";
    const separatorText = "  |  ";
    const websiteText = "www.asianspices.com";
    const emailWidth = doc.getTextWidth(emailText);
    const separatorWidth = doc.getTextWidth(separatorText);
    const websiteWidth = doc.getTextWidth(websiteText);
    const totalFooterWidth = emailWidth + separatorWidth + websiteWidth;
    const footerStartX = footerCenterX - totalFooterWidth / 2;

    doc.textWithLink(emailText, footerStartX, footerTextY, {
      url: "mailto:finance@asianspices.com",
    });
    doc.text(separatorText, footerStartX + emailWidth, footerTextY);
    doc.textWithLink(
      websiteText,
      footerStartX + emailWidth + separatorWidth,
      footerTextY,
      { url: "https://www.asianspices.online/" },
    );

    // Output straight as a raw array buffer stream type
    const pdfOutputArrayBuffer = doc.output("arraybuffer");
    const responseBody = new Uint8Array(pdfOutputArrayBuffer);

    return new NextResponse(responseBody, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice_order_${order.order_number}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Invoice compilation failed:", error);
    return NextResponse.json(
      { error: "Failed compiling invoice file PDF asset" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
