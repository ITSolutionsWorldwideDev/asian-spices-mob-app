import type { Pool, PoolClient } from "pg";

type Db = Pick<Pool, "query">;

export type PromoValidationResult =
  | { valid: true; code: string; discount: number; promoId: number }
  | { valid: false; error: string };

export async function validatePromoCode(
  db: Db | PoolClient,
  code: string,
  subtotal: number,
): Promise<PromoValidationResult> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return { valid: false, error: "Enter a promo code." };
  }

  const result = await db.query(
    `SELECT id, code, discount_type, discount_value, min_order_amount,
            max_discount_amount, usage_limit, usage_count, starts_at, expires_at, status
     FROM store_promo_codes
     WHERE UPPER(code) = $1
     LIMIT 1`,
    [normalized],
  );

  if (!result.rowCount) {
    return { valid: false, error: "Invalid promo code." };
  }

  const promo = result.rows[0];

  if (Number(promo.status) !== 1) {
    return { valid: false, error: "This promo code is not active." };
  }

  const now = new Date();
  if (promo.starts_at && new Date(promo.starts_at) > now) {
    return { valid: false, error: "This promo code is not active yet." };
  }
  if (promo.expires_at && new Date(promo.expires_at) < now) {
    return { valid: false, error: "This promo code has expired." };
  }

  const minOrder = Number(promo.min_order_amount) || 0;
  if (subtotal < minOrder) {
    return {
      valid: false,
      error: `Minimum order amount for this code is €${minOrder.toFixed(2)}.`,
    };
  }

  if (
    promo.usage_limit != null &&
    Number(promo.usage_count) >= Number(promo.usage_limit)
  ) {
    return { valid: false, error: "This promo code has reached its usage limit." };
  }

  const type = String(promo.discount_type || "").toUpperCase();
  const value = Number(promo.discount_value) || 0;
  let discount = 0;

  if (type === "PERCENT" || type === "PERCENTAGE") {
    discount = (subtotal * value) / 100;
  } else if (type === "FIXED" || type === "AMOUNT" || type === "FLAT") {
    discount = value;
  } else {
    return { valid: false, error: "Unsupported promo code type." };
  }

  discount = Math.min(discount, subtotal);

  if (promo.max_discount_amount != null) {
    const maxDiscount = Number(promo.max_discount_amount);
    if (maxDiscount > 0) {
      discount = Math.min(discount, maxDiscount);
    }
  }

  discount = Math.round(discount * 100) / 100;

  return {
    valid: true,
    code: promo.code,
    discount,
    promoId: promo.id,
  };
}

export async function incrementPromoUsage(db: Db | PoolClient, promoId: number) {
  await db.query(
    `UPDATE store_promo_codes SET usage_count = usage_count + 1 WHERE id = $1`,
    [promoId],
  );
}
