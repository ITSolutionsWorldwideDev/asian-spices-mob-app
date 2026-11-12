// app/api/account/orders/action/route.ts
// Aligned with web PRE_SHIPMENT_CANCEL (asian-spices-web)

import { NextResponse } from "next/server";
import { pool } from "@/core/db";
import {
  sendCancellationEmail,
  sendReturnStatusUpdateEmail,
} from "@/core/email-templates";
import {
  FREE_SHIPPING_THRESHOLD,
  MIN_ORDER_AMOUNT_EUR,
  SHIPPING_OPTIONS,
} from "@/lib/pricing";

export async function POST(request: Request) {
  const client = await pool.connect();
  try {
    const body = await request.json();
    const { orderId, actionType, reason, comments, items } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "Missing required order identity reference parameters." },
        { status: 400 },
      );
    }

    // =========================================================================
    // BRANCH A: PRE-SHIPMENT CANCEL (same as web)
    // =========================================================================
    if (actionType === "PRE_SHIPMENT_CANCEL") {
      if (!reason) {
        return NextResponse.json(
          { error: "A cancellation reason must be selected." },
          { status: 400 },
        );
      }

      await client.query("BEGIN");

      const orderRes = await client.query(
        `
        SELECT order_status, payment_status, shipping_status, fulfillment_status,
               payment_method, subtotal, shipping_amount, tax_amount, total_amount,
               shipping_provider
        FROM store_orders
        WHERE id = $1
        LIMIT 1;
        `,
        [orderId],
      );

      if (orderRes.rows.length === 0) {
        throw new Error("Target parent order record could not be found.");
      }

      const order = orderRes.rows[0];
      const originalSubtotal = Number(order.subtotal || 0);
      const originalShipping = Number(order.shipping_amount || 0);
      const originalTax = Number(order.tax_amount || 0);
      const originalTotal = Number(order.total_amount || 0);
      const isPaid = order.payment_status === "paid";
      const standardBaseRate = SHIPPING_OPTIONS.standard.price;

      if (order.order_status?.toLowerCase() === "cancelled") {
        throw new Error("This order has already been cancelled.");
      }

      const shippingStatus = order.shipping_status?.toLowerCase();
      const fulfillmentStatus = order.fulfillment_status?.toLowerCase();
      const isShippedOrLater =
        shippingStatus === "shipped" ||
        shippingStatus === "delivered" ||
        fulfillmentStatus === "shipped";

      if (isShippedOrLater) {
        throw new Error(
          "This order can no longer be cancelled - it has already shipped. Please file a return request instead.",
        );
      }

      const requestedItems: Array<{ itemId: string; quantity?: number }> =
        Array.isArray(items) ? items : [];

      if (requestedItems.length > 0) {
        const activeItemsRes = await client.query(
          `SELECT product_id, quantity, price, tax_amount
           FROM store_order_items
           WHERE order_id = $1 AND COALESCE(status, 'pending') != 'cancelled';`,
          [orderId],
        );
        const activeItems = activeItemsRes.rows;
        const activeById = new Map(
          activeItems.map((row: any) => [String(row.product_id), row]),
        );

        const requested = requestedItems.map((it) => {
          const id = String(it.itemId);
          const row = activeById.get(id);
          if (!row) {
            throw new Error(
              `Item ${id} is not an active line item on this order.`,
            );
          }
          const availableQty = Number(row.quantity);
          const requestedQty = Math.min(
            availableQty,
            Math.max(1, Math.trunc(Number(it.quantity)) || availableQty),
          );
          return { id, row, requestedQty };
        });

        const cancelAmount = requested.reduce(
          (sum, r) => sum + Number(r.row.price) * r.requestedQty,
          0,
        );
        const cancelTax = requested.reduce((sum, r) => {
          const rowQty = Number(r.row.quantity);
          const rowTax = Number(r.row.tax_amount || 0);
          const perUnitTax = rowQty > 0 ? rowTax / rowQty : 0;
          return sum + perUnitTax * r.requestedQty;
        }, 0);

        const subtotal = Number(order.subtotal || 0);
        const shippingAmount = Number(order.shipping_amount || 0);
        const taxAmount = Number(order.tax_amount || 0);
        const newSubtotal = Math.max(0, subtotal - cancelAmount);
        const isFullCancel = newSubtotal <= 0;

        if (
          !isFullCancel &&
          newSubtotal > 0 &&
          newSubtotal < MIN_ORDER_AMOUNT_EUR
        ) {
          throw new Error(
            `Cancelling the selected item(s) would leave a subtotal of €${newSubtotal.toFixed(2)}, below the €${MIN_ORDER_AMOUNT_EUR.toFixed(2)} minimum. Cancel the entire order instead, or keep enough units to stay at or above €${MIN_ORDER_AMOUNT_EUR.toFixed(2)}.`,
          );
        }

        for (const r of requested) {
          const remainingQty = Number(r.row.quantity) - r.requestedQty;
          if (remainingQty <= 0) {
            await client.query(
              `UPDATE store_order_items SET status = 'cancelled' WHERE order_id = $1 AND product_id = $2;`,
              [orderId, r.id],
            );
          } else {
            const rowQty = Number(r.row.quantity);
            const rowTax = Number(r.row.tax_amount || 0);
            const perUnitTax = rowQty > 0 ? rowTax / rowQty : 0;
            await client.query(
              `UPDATE store_order_items SET quantity = $3, tax_amount = $4 WHERE order_id = $1 AND product_id = $2;`,
              [orderId, r.id, remainingQty, perUnitTax * remainingQty],
            );
          }
        }

        if (isFullCancel) {
          await client.query(
            `UPDATE store_order_items SET status = 'cancelled' WHERE order_id = $1;`,
            [orderId],
          );
          await client.query(
            `UPDATE store_orders
             SET order_status = 'cancelled', fulfillment_status = 'close', updated_at = now()
             WHERE id = $1;`,
            [orderId],
          );
        } else {
          const newTax = Math.max(0, taxAmount - cancelTax);
          const shippingMethod = order.shipping_provider?.toLowerCase();
          const isStandardMethod =
            shippingMethod === "standard" ||
            shippingMethod === "standard delivery";
          const newShippingAmount = isStandardMethod
            ? newSubtotal >= FREE_SHIPPING_THRESHOLD
              ? 0
              : standardBaseRate
            : shippingAmount;
          const newTotal = newSubtotal + newShippingAmount;

          await client.query(
            `UPDATE store_orders
             SET subtotal = $2, tax_amount = $3, shipping_amount = $4, total_amount = $5, updated_at = now()
             WHERE id = $1;`,
            [orderId, newSubtotal, newTax, newShippingAmount, newTotal],
          );
        }

        await client.query("COMMIT");

        return NextResponse.json(
          {
            success: true,
            message: isFullCancel
              ? "Order successfully cancelled."
              : "Selected item(s) successfully cancelled.",
            refundHint: isPaid
              ? "Cancelled amount will be refunded to your original payment method."
              : undefined,
          },
          { status: 200 },
        );
      }

      // Legacy whole-order cancel when no items array supplied
      await client.query(
        `UPDATE store_orders
         SET order_status = 'cancelled', fulfillment_status = 'close', updated_at = now()
         WHERE id = $1;`,
        [orderId],
      );
      await client.query(
        `UPDATE store_order_items SET status = 'cancelled' WHERE order_id = $1;`,
        [orderId],
      );

      await client.query("COMMIT");

      try {
        await sendCancellationEmail(
          orderId,
          undefined,
          reason,
          comments,
        );
      } catch (emailErr) {
        console.error("[Cancellation Email Error]:", emailErr);
      }

      return NextResponse.json(
        {
          success: true,
          message: "Order successfully cancelled.",
          totalsSnapshot: {
            subtotal: originalSubtotal,
            shipping: originalShipping,
            tax: originalTax,
            total: originalTotal,
          },
        },
        { status: 200 },
      );
    }

    // =========================================================================
    // BRANCH B: STANDARD POST-SHIPMENT RETURN WORKFLOW
    // =========================================================================

    if (!reason || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Missing required return reasons or item arrays." },
        { status: 400 },
      );
    }

    if (reason === "other" && (!comments || comments.trim().length < 10)) {
      return NextResponse.json(
        {
          error: "Detailed description is required for custom reason requests.",
        },
        { status: 400 },
      );
    }

    await client.query("BEGIN");

    const orderInfoQuery = `SELECT customer_id FROM store_orders WHERE id = $1 LIMIT 1;`;
    const orderInfoRes = await client.query(orderInfoQuery, [orderId]);
    if (orderInfoRes.rows.length === 0) {
      throw new Error("Parent order data record lookup returned empty.");
    }
    const customerId = orderInfoRes.rows[0].customer_id;

    const quantityCheckQuery = `
      SELECT 
        oi.quantity as original_ordered_qty,
        COALESCE(SUM(ri.quantity), 0) as already_returned_qty
      FROM store_order_items oi
      LEFT JOIN store_order_return_items ri ON ri.product_id = oi.product_id
      LEFT JOIN store_order_returns r ON r.id = ri.return_id AND r.status != 'rejected'
      WHERE oi.order_id = $1 AND oi.product_id = $2
      GROUP BY oi.quantity;
    `;

    for (const item of items) {
      const productId = item.itemId;
      const checkRes = await client.query(quantityCheckQuery, [
        orderId,
        productId,
      ]);

      if (checkRes.rows.length === 0) {
        throw new Error(
          `The item ${productId} does not exist in the original order.`,
        );
      }

      const { original_ordered_qty, already_returned_qty } = checkRes.rows[0];

      if (
        parseInt(already_returned_qty, 10) + parseInt(item.quantity, 10) >
        parseInt(original_ordered_qty, 10)
      ) {
        throw new Error(
          `Invalid Return Quantity. Already filed for ${already_returned_qty} out of ${original_ordered_qty} units.`,
        );
      }
    }

    const uniqueHash = Math.floor(1000 + Math.random() * 9000);
    const returnNumber = `RET-${Date.now().toString().slice(-6)}-${uniqueHash}`;
    const combinedNotes = comments ? `User Note: ${comments.trim()}` : null;

    const returnInsertQuery = `
      INSERT INTO store_order_returns (order_id, customer_id, return_number, reason, admin_notes, status)
      VALUES ($1, $2, $3, $4, $5, 'pending')
      RETURNING id, return_number;
    `;
    const returnResult = await client.query(returnInsertQuery, [
      orderId,
      customerId,
      returnNumber,
      reason,
      combinedNotes,
    ]);
    const returnId = returnResult.rows[0].id;

    const itemInsertQuery = `
      INSERT INTO store_order_return_items (return_id, product_id, quantity)
      VALUES ($1, $2, $3);
    `;

    for (const item of items) {
      await client.query(itemInsertQuery, [
        returnId,
        item.itemId,
        item.quantity,
      ]);
    }

    await client.query("COMMIT");

    try {
      await sendReturnStatusUpdateEmail(returnId);
    } catch (emailErr) {
      console.error("Non-fatal email alert engine failure:", emailErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Return request filed successfully.",
        returnNumber: returnResult.rows[0].return_number,
      },
      { status: 200 },
    );
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("Database order management routing failure:", error);
    return NextResponse.json(
      {
        error:
          error.message ||
          "Internal transaction failure parsing order records.",
      },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}

