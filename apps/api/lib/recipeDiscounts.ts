import type { Pool, PoolClient } from "pg";

type Db = Pick<Pool, "query">;

export type RecipeDiscountValidationResult =
  | { valid: true; id: string; label: string; discount: number }
  | { valid: false; error: string };

function computeDiscount(subtotal: number, discountType: string, discountValue: number) {
  const type = discountType.toUpperCase();
  let discount = 0;

  if (type === "PERCENT" || type === "PERCENTAGE") {
    discount = (subtotal * discountValue) / 100;
  } else if (type === "FIXED" || type === "FLAT" || type === "AMOUNT") {
    discount = discountValue;
  }

  return Math.round(Math.min(discount, subtotal) * 100) / 100;
}

export async function validateRecipeDiscount(
  db: Db | PoolClient,
  userId: string,
  discountId: string,
  subtotal: number,
): Promise<RecipeDiscountValidationResult> {
  if (!userId) {
    return { valid: false, error: "Login required to use recipe discounts." };
  }

  if (!discountId?.trim()) {
    return { valid: false, error: "Select a recipe discount." };
  }

  const result = await db.query(
    `SELECT rld.id, rld.discount_type, rld.discount_value, r.title AS recipe_title
     FROM recipe_like_discounts rld
     LEFT JOIN recipes r ON r.id = rld.recipe_id
     WHERE rld.id = $1 AND rld.user_id = $2
     LIMIT 1`,
    [discountId, userId],
  );

  if (!result.rowCount) {
    return { valid: false, error: "Recipe discount not available for your account." };
  }

  const row = result.rows[0];
  const discount = computeDiscount(
    subtotal,
    String(row.discount_type || ""),
    Number(row.discount_value) || 0,
  );

  if (discount <= 0) {
    return { valid: false, error: "This recipe discount has no value." };
  }

  const recipeTitle = row.recipe_title?.trim() || "Recipe";
  return {
    valid: true,
    id: row.id,
    label: `${recipeTitle} discount`,
    discount,
  };
}

export async function getUserRecipeDiscounts(db: Db | PoolClient, userId: string) {
  const result = await db.query(
    `SELECT rld.id, rld.recipe_id, rld.discount_type, rld.discount_value, r.title AS recipe_title
     FROM recipe_like_discounts rld
     LEFT JOIN recipes r ON r.id = rld.recipe_id
     WHERE rld.user_id = $1
     ORDER BY rld.created_at DESC`,
    [userId],
  );

  return result.rows.map((row) => ({
    id: row.id,
    recipeId: row.recipe_id,
    recipeTitle: row.recipe_title?.trim() || "Recipe",
    discountType: row.discount_type,
    discountValue: Number(row.discount_value) || 0,
  }));
}
