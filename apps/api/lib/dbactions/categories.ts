import { pool } from "@/core/db";

export const getCategoryWithSubcategories = async (
  slug: string,
  subcategoryIds: string[] = [],
) => {
  try {
    // 🔹 Step 1: Get category by slug
    const categoryResult = await pool.query(
      `SELECT id, slug, name 
       FROM store_categories 
       WHERE LOWER(slug) = LOWER($1)
         AND status = 1`,
      [slug],
    );

    if (categoryResult.rows.length === 0) {
      return { error: "Category not found" };
    }

    const category = categoryResult.rows[0];

    // 🔹 Step 2: Get subcategories with product counts
    const subCategoryResult = await pool.query(
      `SELECT
        sc.id,
        sc.name,
        COUNT(p.id)::int AS product_count
       FROM store_subcategories sc
       LEFT JOIN store_products p ON p.subcategory_id = sc.id
       WHERE sc.category_id = $1
         AND sc.status = 1
       GROUP BY sc.id, sc.name
       ORDER BY sc.name ASC`,
      [category.id],
    );

    const brandValues: unknown[] = [category.id];
    let brandFilter = "p.category_id = $1 AND p.brand_id IS NOT NULL";

    if (subcategoryIds.length > 0) {
      brandValues.push(subcategoryIds);
      brandFilter += ` AND p.subcategory_id = ANY($${brandValues.length}::uuid[])`;
    }

    const brandsResult = await pool.query(
      `SELECT
        p.brand_id,
        COALESCE(b.name, 'Unknown Brand') AS name,
        COUNT(DISTINCT p.id)::int AS product_count
       FROM store_products p
       LEFT JOIN store_brands b ON b.brand_id = p.brand_id
       WHERE ${brandFilter}
       GROUP BY p.brand_id, b.name
       ORDER BY name ASC`,
      brandValues,
    );

    return {
      category,
      subcategories: subCategoryResult.rows,
      brands: brandsResult.rows,
    };
  } catch (error) {
    console.error("DB Action Error:", error);
    return { error: "Database error" };
  }
};
