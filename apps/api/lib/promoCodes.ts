import type { Pool, PoolClient } from "pg";

type Db = Pick<Pool, "query">;

/**
 * Promo validation aligned with asian-spices-web
 * `app/api/checkout/promo/route.ts` → `validatePromo`.
 *
 * `promoId` / `discount` are kept for create-order usage increment and mobile clients.
 */
export type PromoValidationResult =
  | {
      valid: true;
      code: string;
      discount_type: "PERCENT" | "FLAT";
      discount_value: number;
      discount_amount: number;
      /** Alias of discount_amount for existing mobile/create-order callers */
      discount: number;
      promoId: number;
    }
  | { valid: false; error: string };

export async function validatePromoCode(
  db: Db | PoolClient,
  rawCode: string,
  subtotal: number,
): Promise<PromoValidationResult> {
  const code = rawCode.trim();

  if (!code) {
    return { valid: false, error: "Enter a promo code." };
  }

  const result = await db.query(
    `SELECT id, code, discount_type, discount_value, min_order_amount,
            max_discount_amount, usage_limit, usage_count, starts_at, expires_at, status
     FROM store_promo_codes
     WHERE UPPER(code) = UPPER($1)
     LIMIT 1`,
    [code],
  );

  const promo = result.rows[0];

  if (!promo || Number(promo.status) !== 1) {
    return { valid: false, error: "Invalid or inapplicable promo code." };
  }

  const now = new Date();

  if (promo.starts_at && new Date(promo.starts_at) > now) {
    return { valid: false, error: "This promo code isn't active yet." };
  }

  if (promo.expires_at && new Date(promo.expires_at) < now) {
    return { valid: false, error: "This promo code has expired." };
  }

  if (
    promo.usage_limit != null &&
    Number(promo.usage_count) >= Number(promo.usage_limit)
  ) {
    return {
      valid: false,
      error: "This promo code has reached its usage limit.",
    };
  }

  // Web: only enforce when truthy (null/0 skips)
  if (promo.min_order_amount && subtotal < Number(promo.min_order_amount)) {
    return {
      valid: false,
      error: `This code requires a minimum order of €${Number(promo.min_order_amount).toFixed(2)}.`,
    };
  }

  // Web: only exact "PERCENT" is percentage; everything else is flat EUR
  let discountAmount =
    promo.discount_type === "PERCENT"
      ? subtotal * (Number(promo.discount_value) / 100)
      : Number(promo.discount_value);

  // Web applies max_discount_amount even when 0 (can zero out the discount)
  if (promo.max_discount_amount != null) {
    discountAmount = Math.min(discountAmount, Number(promo.max_discount_amount));
  }

  // Never discount more than the order itself
  discountAmount = Math.max(0, Math.min(discountAmount, subtotal));
  discountAmount = Math.round(discountAmount * 100) / 100;

  const discountType: "PERCENT" | "FLAT" =
    promo.discount_type === "PERCENT" ? "PERCENT" : "FLAT";

  return {
    valid: true,
    code: promo.code,
    discount_type: discountType,
    discount_value: Number(promo.discount_value),
    discount_amount: discountAmount,
    discount: discountAmount,
    promoId: promo.id,
  };
}

export async function incrementPromoUsage(db: Db | PoolClient, promoId: number) {
  await db.query(
    `UPDATE store_promo_codes SET usage_count = usage_count + 1 WHERE id = $1`,
    [promoId],
  );
}
