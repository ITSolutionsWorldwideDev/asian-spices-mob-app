// app/api/create-order/route.tsx

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";

import { getServerSession } from "next-auth";
import { webAuthOptions } from "@/core/auth";

import {
  assignNextStore,
  logOrderEvent,
  ORDER_EVENTS,
} from "@/core/order-routing";
import { incrementPromoUsage, validatePromoCode } from "@/lib/promoCodes";
import { validateRecipeDiscount } from "@/lib/recipeDiscounts";

const MIN_ORDER_AMOUNT_EUR = 10;

export async function POST(req: NextRequest) {
  const client = await pool.connect();

  const session = await getServerSession(webAuthOptions);

  const userId = session?.user?.id || null;
  const userEmail = session?.user?.email || null;

  try {
    const body = await req.json();

    const { customer, shippingAddress, cartItems, pricing, shippingMethod, promoCode, recipeDiscountId } = body;

    if (!cartItems?.length) {
      return errorResponse("Cart is empty", "EMPTY_CART");
    }

    const merchandiseSubtotalEur = (cartItems as Array<{
      base_price?: number;
      price?: number;
      quantity?: number;
    }>).reduce((sum, item) => {
      const unit = Number(item.base_price ?? item.price ?? 0);
      const qty = Number(item.quantity ?? 1);
      return sum + unit * qty;
    }, 0);

    if (merchandiseSubtotalEur < MIN_ORDER_AMOUNT_EUR) {
      return errorResponse(
        `Minimum order amount is €${MIN_ORDER_AMOUNT_EUR.toFixed(2)}. Please add more items to your cart.`,
        "MIN_ORDER_AMOUNT",
      );
    }

    let discountAmount = 0;
    let appliedPromoId: number | null = null;

    // Match web checkout stacking: promo first, then recipe on remaining subtotal
    if (typeof promoCode === "string" && promoCode.trim()) {
      const promo = await validatePromoCode(client, promoCode, merchandiseSubtotalEur);
      if (!promo.valid) {
        return errorResponse(promo.error, "INVALID_PROMO");
      }
      discountAmount += promo.discount;
      appliedPromoId = promo.promoId;
    }

    const afterPromo = Math.max(0, merchandiseSubtotalEur - discountAmount);

    if (typeof recipeDiscountId === "string" && recipeDiscountId.trim()) {
      if (!userId) {
        return errorResponse(
          "Login required to use recipe discounts.",
          "RECIPE_DISCOUNT_AUTH_REQUIRED",
        );
      }

      const recipeDiscount = await validateRecipeDiscount(
        client,
        userId,
        recipeDiscountId,
        afterPromo,
      );

      if (!recipeDiscount.valid) {
        return errorResponse(recipeDiscount.error, "INVALID_RECIPE_DISCOUNT");
      }

      discountAmount += recipeDiscount.discount;
    }

    discountAmount = Math.min(discountAmount, merchandiseSubtotalEur);

    const shippingAmount = Number(pricing?.shipping) || 0;
    const taxAmount = Number(pricing?.tax_amount) || 0;
    const orderSubtotal = merchandiseSubtotalEur;
    const orderTotal = Math.max(0, orderSubtotal - discountAmount) + shippingAmount;

    const email = userId ? userEmail : customer.email;

    const { latitude, longitude, country } = shippingAddress;

    if (!latitude || !longitude) {
      return errorResponse(
        "Please enter a valid delivery address.",
        "MISSING_LOCATION",
      );
    }

    await client.query("BEGIN");

    let customer_id: string;

    // ====================================================
    // 1️⃣ CUSTOMER
    // ====================================================

    if (userId) {
      const existing = await client.query(
        `
        SELECT id
        FROM store_customers
        WHERE user_id = $1
        LIMIT 1
      `,
        [userId],
      );

      if (existing.rowCount) {
        customer_id = existing.rows[0].id;
      } else {
        const result = await client.query(
          `
          INSERT INTO store_customers
          (
            user_id,
            first_name,
            last_name,
            email,
            phone,
            city,
            postcode
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7)
          RETURNING id
        `,
          [
            userId,
            customer.firstName,
            customer.lastName,
            email,
            customer.phone,
            shippingAddress.city,
            shippingAddress.postal_code,
          ],
        );

        customer_id = result.rows[0].id;
      }
    } else {
      // ====================================================
      // GUEST CUSTOMER
      // ====================================================

      const result = await client.query(
        `
        INSERT INTO store_customers
        (
          first_name,
          last_name,
          email,
          phone,
          city,
          postcode
        )
        VALUES ($1,$2,$3,$4,$5,$6)
        RETURNING id
      `,
        [
          customer.firstName,
          customer.lastName,
          email,
          customer.phone,
          shippingAddress.city,
          shippingAddress.postal_code,
        ],
      );

      customer_id = result.rows[0].id;

      // optional guest auto account creation
      const userCheck = await client.query(
        `
        SELECT id
        FROM users
        WHERE email = $1
      `,
        [email],
      );

      if (userCheck.rowCount === 0) {
        const bcrypt = require("bcryptjs");

        const tempPassword = Math.random().toString(36).slice(-8);

        const hash = await bcrypt.hash(tempPassword, 10);

        const newUser = await client.query(
          `
          INSERT INTO users
          (email, password_hash)
          VALUES ($1,$2)
          RETURNING id
        `,
          [email, hash],
        );

        const newUserId = newUser.rows[0].id;

        await client.query(
          `
          UPDATE store_customers
          SET user_id = $1
          WHERE id = $2
        `,
          [newUserId, customer_id],
        );
      }
    }

    // ====================================================
    // 2️⃣ ADDRESS
    // ====================================================

    await client.query(
      `
      INSERT INTO store_customer_addresses
      (
        customer_id,
        label,
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        country,
        latitude,
        longitude
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
      )

      ON CONFLICT
      (
        customer_id,
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        country
      )
      DO NOTHING
    `,
      [
        customer_id,
        "Home",
        shippingAddress.address_line1,
        shippingAddress.address_line2,
        shippingAddress.city,
        shippingAddress.state,
        shippingAddress.postal_code,
        shippingAddress.country,
        latitude,
        longitude,
      ],
    );

    // ====================================================
    // 3️⃣ VALIDATE PRODUCTS EXIST
    // ====================================================

    /* const productIds = cartItems.map(
      (item: any) => item.id,
    );

    const productCatalog = await client.query(
      `
      SELECT
        spc.store_id,
        spc.product_id,
        spc.price,
        spc.quantity,
        spc.status

      FROM store_product_catalog spc

      JOIN store_addresses sa
        ON sa.store_id = spc.store_id

      WHERE spc.product_id = ANY($1)
        AND sa.country = $2
        AND spc.status = 1
        AND spc.quantity > 0
    `,
      [productIds, country],
    );

    if (!productCatalog.rowCount) {
      return errorResponse(
        "No stores available for your location.",
        "NO_STORE_AVAILABLE",
      );
    } */

    // ====================================================
    // 4️⃣ CREATE ORDER
    // ====================================================

    const orderNumber = `ORD-${Date.now()}`;

    const orderResult = await client.query(
      `
      INSERT INTO store_orders
      (
        order_number,
        customer_id,
        customer_email,

        order_status,
        routing_status,
        fulfillment_status,
        payment_status,

        subtotal,
        discount_amount,
        shipping_amount,
        tax_amount,
        total_amount,

        shipping_address_line1,
        shipping_address_line2,
        shipping_city,
        shipping_state,
        shipping_postal_code,
        shipping_country,

        shipping_latitude,
        shipping_longitude,
        shipping_provider
      )

      VALUES
      (
        $1,$2,$3,
        'pending',
        'pending',
        'pending',
        'pending',

        $4,$5,$6,$7,$8,

        $9,$10,$11,$12,$13,$14,

        $15,$16,$17
      )

      RETURNING *
    `,
      [
        orderNumber,
        customer_id,
        email,

        orderSubtotal,
        discountAmount,
        shippingAmount,
        taxAmount,
        orderTotal,

        shippingAddress.address_line1,
        shippingAddress.address_line2,
        shippingAddress.city,
        shippingAddress.state,
        shippingAddress.postal_code,
        shippingAddress.country,

        latitude,
        longitude,
        shippingMethod || "Standard Delivery"
      ],
    );

    const order = orderResult.rows[0];

    const order_id = order.id;

    if (appliedPromoId) {
      await incrementPromoUsage(client, appliedPromoId);
    }

    // ====================================================
    // 5️⃣ CREATE ORDER ITEMS
    // ====================================================

    for (const item of cartItems) {
      // lowest available base_price
      /* const availableProducts =
        productCatalog.rows
          .filter(
            (p: any) =>
              p.product_id === item.id,
          )
          .sort(
            (a: any, b: any) =>
              Number(a.base_price) -
              Number(b.base_price),
          );

      if (!availableProducts.length) {
        throw new Error(
          `${item.title} is unavailable`,
        );
      }

      const selectedProduct =
        availableProducts[0]; */

      await client.query(
        `
        INSERT INTO store_order_items
        (
          order_id,
          product_id,
          quantity,
          fulfilled_quantity,
          price,
          status
        )
        VALUES ($1,$2,$3,0,$4,'pending')
      `,
        [
          order_id,
          item.id,
          item.quantity,
          // Number(selectedProduct.base_price),
          Number(item.base_price),
        ],
      );
    }

    // ====================================================
    // 6️⃣ ROUTE ORDER
    // ====================================================

    // await assignNextStore(client, order_id);

    // ====================================================
    // 7️⃣ EVENT LOG
    // ====================================================

    /* await logOrderEvent(client, {
      orderId: order_id,
      eventType: ORDER_EVENTS.ASSIGNED,
      message:
        "Order created and routing started",
      metadata: {
        customer_id,
        item_count: cartItems.length,
      },
    }); */

    await logOrderEvent(client, {
      orderId: order_id,
      eventType: ORDER_EVENTS.CREATED,
      message:
        "Order authorization records generated. Awaiting confirmation of client transaction settlement.",
      metadata: { item_count: cartItems.length },
    });

    await client.query("COMMIT");

    // Do not notify here — the order is only pending payment.
    // "Order Placed" is sent after payment is confirmed (Pay.nl / PayPal).

    return NextResponse.json({
      success: true,
      orderId: order_id,
      orderNumber: order.order_number,
      routingStatus: "unrouted",
      orderStatus: "pending",
    });

    // ====================================================
    // 8️⃣ FETCH FINAL ROUTED ORDER
    // ====================================================

    /* 
    const finalOrder = await client.query(
      `
      SELECT
        id,
        order_number,
        current_store_id,
        routing_status,
        fulfillment_status,
        order_status
      FROM store_orders
      WHERE id = $1
    `,
      [order_id],
    );

    return NextResponse.json({
      success: true,

      orderId: order_id,

      orderNumber:
        finalOrder.rows[0].order_number,

      currentStoreId:
        finalOrder.rows[0].current_store_id,

      routingStatus:
        finalOrder.rows[0].routing_status,

      fulfillmentStatus:
        finalOrder.rows[0]
          .fulfillment_status,

      orderStatus:
        finalOrder.rows[0].order_status,
    }); */
  } catch (error: any) {
    await client.query("ROLLBACK");

    console.error("Create order error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Order creation failed",
      },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}

// ====================================================
// ERROR RESPONSE
// ====================================================

const errorResponse = (message: string, code: string, status = 400) => {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code,
    },
    { status },
  );
};

/* import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";

import { getServerSession } from "next-auth";
import { webAuthOptions } from "@/core/auth";

export async function POST(req: NextRequest) {
  const client = await pool.connect();

  const session = await getServerSession(webAuthOptions);
  const userId = session?.user?.id || null;
  const userEmail = session?.user?.email || null;

  try {
    const body = await req.json();

    const { customer, shippingAddress, cartItems, pricing } = body;

    const email = userId ? userEmail : customer.email;

    const { latitude, longitude } = shippingAddress;

    if (!latitude || !longitude) {
      return errorResponse(
        "Please enter a valid delivery address to continue.",
        "MISSING_LOCATION",
      );
    }

    await client.query("BEGIN");

    let customer_id: string;

    // =========================================
    // 1️⃣ CUSTOMER (ALWAYS store_customers)
    // =========================================
    if (userId) {
      // 🔍 find existing store_customer
      const existing = await client.query(
        `SELECT id FROM store_customers WHERE user_id = $1 LIMIT 1`,
        [userId],
      );

      if (existing.rowCount) {
        customer_id = existing.rows[0].id;
      } else {
        const result = await client.query(
          `INSERT INTO store_customers 
           (user_id, first_name, last_name, email, phone, city, postcode)
           VALUES ($1,$2,$3,$4,$5,$6,$7)
           RETURNING id`,
          [
            userId,
            customer.firstName,
            customer.lastName,
            email,
            customer.phone,
            shippingAddress.city,
            shippingAddress.postal_code,
          ],
        );

        customer_id = result.rows[0].id;
      }
    } else {
      // =========================================
      // 👤 GUEST FLOW
      // =========================================
      const result = await client.query(
        `INSERT INTO store_customers 
         (first_name, last_name, email, phone, city, postcode)
         VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING id`,
        [
          customer.firstName,
          customer.lastName,
          email,
          customer.phone,
          shippingAddress.city,
          shippingAddress.postal_code,
        ],
      );

      customer_id = result.rows[0].id;

      const userCheck = await client.query(
        `SELECT id FROM users WHERE email = $1`,
        [email],
      );

      if (userCheck.rowCount === 0) {
        const bcrypt = require("bcryptjs");
        const tempPassword = Math.random().toString(36).slice(-8);
        const hash = await bcrypt.hash(tempPassword, 10);

        const newUser = await client.query(
          `INSERT INTO users (email, password_hash)
           VALUES ($1,$2)
           RETURNING id`,
          [email, hash],
        );

        const newUserId = newUser.rows[0].id;

        await client.query(
          `UPDATE store_customers 
           SET user_id = $1 
           WHERE id = $2`,
          [newUserId, customer_id],
        );
      }
    }

    // =========================================
    // 2️⃣ ADDRESS
    // =========================================

    const addressRes = await client.query(
      `INSERT INTO store_customer_addresses
      (customer_id, label, address_line1, address_line2, city, state, postal_code, country)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT (customer_id, address_line1, address_line2, city, state, postal_code, country)
      DO NOTHING
      RETURNING id`,
      [
        customer_id,
        "Home",
        shippingAddress.address_line1,
        shippingAddress.address_line2,
        shippingAddress.city,
        shippingAddress.state,
        shippingAddress.postal_code,
        shippingAddress.country,
      ],
    );

    // =========================================
    // 3️⃣ FIND STORES
    // =========================================
    const storesResult = await client.query(
      `
      SELECT sa.store_id,
        (
          6371 * acos(
            cos(radians($1)) * cos(radians(sa.latitude)) *
            cos(radians(sa.longitude) - radians($2)) +
            sin(radians($1)) * sin(radians(sa.latitude))
          )
        ) AS distance
      FROM store_addresses sa
      WHERE sa.latitude IS NOT NULL AND sa.longitude IS NOT NULL
      ORDER BY distance ASC
      LIMIT 10
      `,
      [latitude, longitude],
    );

    const nearestStores = storesResult.rows;

    if (!nearestStores.length) {
      return errorResponse(
        "We don't deliver to your location yet.",
        "NO_NEARBY_STORES",
      );
    }

    const storeIds = nearestStores.map((s) => s.store_id);
    const productIds = cartItems.map((item: any) => item.id);

    const catalogResult = await client.query(
      `
      SELECT store_id, product_id, price, 9999 AS quantity
      FROM store_product_catalog
      WHERE product_id = ANY($1) AND store_id = ANY($2)
      `,
      [productIds, storeIds],
    );

    const catalog = catalogResult.rows;

    const bestStore = selectBestStore(nearestStores, cartItems, catalog);

    if (!bestStore) {
      return errorResponse(
        "Sorry, no nearby store has all items in stock.",
        "NO_STORE_AVAILABLE",
      );
    }

    // =========================================
    // 4️⃣ CREATE ORDER
    // =========================================
    const orderResult = await client.query(
      `INSERT INTO store_orders
        (store_id, current_store_id, order_number, customer_id, customer_email, order_status,
         subtotal, discount_amount, shipping_amount, total_amount, payment_status,
      shipping_address_line1,
      shipping_address_line2,
      shipping_city,
      shipping_state,
      shipping_postal_code,
      shipping_country,
      shipping_latitude,
      shipping_longitude,
      tax_amount)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,
      $12,$13,$14,$15,$16,$17,$18,$19,$20)
       RETURNING id`,
      [
        bestStore,
        bestStore,
        `ORD-${Date.now()}`,
        customer_id,
        email,
        "pending",
        pricing.subtotal,
        pricing.discount,
        pricing.shipping,
        pricing.total,
        "pending",
        shippingAddress.address_line1,
        shippingAddress.address_line2,
        shippingAddress.city,
        shippingAddress.state,
        shippingAddress.postal_code,
        shippingAddress.country,
        shippingAddress.latitude,
        shippingAddress.longitude,
        pricing.tax_amount,
      ],
    );

    const order_id = orderResult.rows[0].id;

    // =========================================
    // 5️⃣ ORDER ITEMS
    // =========================================
    for (const item of cartItems) {
      const product = catalog.find(
        (c) => c.store_id === bestStore && c.product_id === item.id,
      );

      if (!product || product.quantity < item.quantity) {
        return errorResponse(`${item.title} is out of stock`, "OUT_OF_STOCK");
      }

      await client.query(
        `INSERT INTO store_order_items (order_id, product_id, quantity, price)
         VALUES ($1,$2,$3,$4)`,
        [order_id, item.id, item.quantity, Number(product.price)],
      );
    }

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      orderId: order_id,
    });
  } catch (error: any) {
    await client.query("ROLLBACK");

    console.error("Create order error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Order creation failed",
      },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}

// -----------------------
// Helper function
// -----------------------
const selectBestStore = (stores: any[], cartItems: any[], catalog: any[]) => {
  let bestStore = null;
  let bestScore = Infinity;

  for (const store of stores) {
    const storeId = store.store_id;
    let total = 0;
    let valid = true;

    for (const item of cartItems) {
      const product = catalog.find(
        (c) => c.store_id === storeId && c.product_id === item.id,
      );
      if (!product || product.quantity < item.quantity) {
        valid = false;
        break;
      }
      total += Number(product.base_price) * item.quantity;
    }

    if (!valid) continue;

    // score = total price + small distance weight
    const score = total + store.distance * 0.01;
    if (score < bestScore) {
      bestScore = score;
      bestStore = storeId;
    }
  }

  return bestStore;
};

const errorResponse = (message: string, code: string, status = 400) => {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code,
    },
    { status },
  );
};
 */
