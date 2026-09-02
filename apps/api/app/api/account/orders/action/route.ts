// app/api/account/orders/action/route.ts

import { NextResponse } from "next/server";
import { pool } from "@/core/db";
import { sendReturnStatusUpdateEmail } from "@/core/email-templates";

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
    // BRANCH A: PRE-SHIPMENT CANCEL WORKFLOW
    // =========================================================================

    if (actionType === "PRE_SHIPMENT_CANCEL") {
      await client.query("BEGIN");

      // 1. Verify the order is in a state that allows immediate cancellation
      const statusCheckQuery = `SELECT order_status FROM store_orders WHERE id = $1 LIMIT 1;`;
      const statusCheckRes = await client.query(statusCheckQuery, [orderId]);

      if (statusCheckRes.rows.length === 0) {
        throw new Error("Target parent order record could not be found.");
      }

      const currentStatus = statusCheckRes.rows[0].order_status?.toLowerCase();
      const allowCancelStatuses = ["pending", "confirmed", "processing"];

      if (!allowCancelStatuses.includes(currentStatus)) {
        throw new Error(
          `Order cannot be cancelled because it is already marked as '${currentStatus}'.`,
        );
      }

      // 2. Extract allocations linked to this order to find product ids, store nodes, and volumes
      const getAllocationsQuery = `
        SELECT id, store_id, order_item_id, allocated_quantity, status
        FROM order_item_allocations
        WHERE order_id = $1 AND status IN ('allocated', 'processing', 'fulfilled');
      `;
      const { rows: allocations } = await client.query(getAllocationsQuery, [
        orderId,
      ]);

      // 3. Revert quantities back to their respective multi-tenant store nodes
      const restockInventoryQuery = `
        UPDATE store_products
        SET stock = stock + $1, updated_at = now()
        WHERE product_id = $2 AND store_id = $3;
      `;

      const updateAllocStatusQuery = `
        UPDATE order_item_allocations 
        SET status = 'cancelled', updated_at = now() 
        WHERE id = $1;
      `;

      for (const alloc of allocations) {
        // Restock inventory pool
        await client.query(restockInventoryQuery, [
          alloc.allocated_quantity,
          alloc.product_id,
          alloc.store_id,
        ]);

        // Terminate individual tracking row allocation lifecycle
        await client.query(updateAllocStatusQuery, [alloc.id]);
      }

      // 4. Set the core order document status explicitly to cancelled
      const updateMasterOrderQuery = `
        UPDATE store_orders 
        SET order_status = 'cancelled', updated_at = now() 
        WHERE id = $1;
      `;
      await client.query(updateMasterOrderQuery, [orderId]);

      await client.query("COMMIT");

      return NextResponse.json(
        {
          success: true,
          message:
            "Order successfully cancelled and supplier inventories updated.",
        },
        { status: 200 },
      );
    }

    // =========================================================================
    // BRANCH B: STANDARD POST-SHIPMENT RETURN WORKFLOW (Existing Flow)
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

    // Fire email update notification for returns safely backgrounded
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

/* import { NextResponse } from "next/server";
import { pool } from "@/core/db";
import { sendReturnStatusUpdateEmail } from "@/core/email-templates";

export async function POST(request: Request) {
  const client = await pool.connect();
  try {
    const body = await request.json();
    const { orderId, reason, comments, items } = body;

    if (
      !orderId ||
      !reason ||
      !items ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        {
          error: "Missing required request parameters or empty item selection.",
        },
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

    // Fetch the customer_id associated with this order since the schema marks it as NOT NULL
    const orderInfoQuery = `SELECT customer_id FROM store_orders WHERE id = $1 LIMIT 1;`;
    const orderInfoRes = await client.query(orderInfoQuery, [orderId]);
    if (orderInfoRes.rows.length === 0) {
      throw new Error("Parent order data record lookup returned empty.");
    }
    const customerId = orderInfoRes.rows[0].customer_id;

    // 2. Loop through incoming requested items to validate cumulative quantity ceilings
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
      const productId = item.itemId; // Maps to item.itemId based on your payload context
      const checkRes = await client.query(quantityCheckQuery, [orderId, productId]);
      
      if (checkRes.rows.length === 0) {
        throw new Error(`The item ${productId} does not exist in the original order.`);
      }

      const { original_ordered_qty, already_returned_qty } = checkRes.rows[0];

      if (parseInt(already_returned_qty, 10) + parseInt(item.quantity, 10) > parseInt(original_ordered_qty, 10)) {
        throw new Error(`Invalid Return Quantity. You have already filed for ${already_returned_qty} out of ${original_ordered_qty} purchased units.`);
      }
    }

    // Generate a clean, sequential/unique return reference string
    const uniqueHash = Math.floor(1000 + Math.random() * 9000); // 4 digit random sequence
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

    await sendReturnStatusUpdateEmail(returnId);

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
    console.error("Database return registration transaction crash:", error);
    return NextResponse.json(
      { error: "Internal Database processing failure saving return details." },
      { status: 500 },
    );
  } finally {
    client.release();
  }
} */
