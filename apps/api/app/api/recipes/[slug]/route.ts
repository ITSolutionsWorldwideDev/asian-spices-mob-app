// app/api/recipes/[slug]/route.ts

import { NextRequest, NextResponse } from "next/server";

import { pool } from "@/core/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const { rows } = await pool.query(
      `
      SELECT
        r.*,

        rc.id AS category_id,
        rc.name AS category_name,
        rc.slug AS category_slug,

        COALESCE(
          JSON_AGG(
            DISTINCT JSONB_BUILD_OBJECT(
              'id', rt.id,
              'name', rt.name,
              'slug', rt.slug,
              'color', rt.color
            )
          ) FILTER (WHERE rt.id IS NOT NULL),
          '[]'
        ) AS tags

      FROM recipes r

      LEFT JOIN recipe_categories rc
        ON rc.id = r.category_id

      LEFT JOIN recipe_recipe_tags rrt
        ON rrt.recipe_id = r.id

      LEFT JOIN recipe_tags rt
        ON rt.id = rrt.tag_id

      WHERE
        r.slug = $1
        AND r.status = 'published'

      GROUP BY
        r.id,
        rc.id

      LIMIT 1
      `,
      [slug],
    );

    const recipe = rows[0];

    if (!recipe) {
      return NextResponse.json(
        {
          success: false,
          error: "Recipe not found",
        },
        {
          status: 404,
        },
      );
    }

    /*
     * INGREDIENTS
     */
    const ingredientsRes = await pool.query(
      `
      SELECT
        ri.ingredients_id,
        ri.ingredient_name,
        ri.quantity,
        ri.unit,
        match.product_id,
        match.product_name,
        match.product_base_price,
        match.product_image
      FROM recipe_ingredients ri
      LEFT JOIN LATERAL (
        SELECT
          p.id AS product_id,
          p.name AS product_name,
          p.base_price::numeric AS product_base_price,
          img.file_url AS product_image
        FROM store_products p
        LEFT JOIN (
          SELECT DISTINCT ON (pi.product_id)
            pi.product_id,
            md.file_url
          FROM store_product_images pi
          LEFT JOIN media md ON md.media_id = pi.url::int
          ORDER BY pi.product_id, pi.is_primary DESC, pi.id ASC
        ) img ON img.product_id = p.id
        WHERE LOWER(TRIM(p.name)) = LOWER(TRIM(ri.ingredient_name))
          OR LOWER(p.name) LIKE '%' || LOWER(TRIM(ri.ingredient_name)) || '%'
          OR LOWER(TRIM(ri.ingredient_name)) LIKE '%' || LOWER(TRIM(p.name)) || '%'
        ORDER BY
          CASE
            WHEN LOWER(TRIM(p.name)) = LOWER(TRIM(ri.ingredient_name)) THEN 0
            WHEN LOWER(p.name) LIKE LOWER(TRIM(ri.ingredient_name)) || '%' THEN 1
            WHEN LOWER(TRIM(ri.ingredient_name)) LIKE '%' || LOWER(TRIM(p.name)) || '%' THEN 2
            ELSE 3
          END,
          LENGTH(p.name) ASC
        LIMIT 1
      ) match ON true
      WHERE ri.recipe_id = $1
      ORDER BY ri.created_at ASC
      `,
      [recipe.id],
    );

    /*
     * NUTRITION
     */
    const nutritionRes = await pool.query(
      `
      SELECT
        nutrition_id,
        nutrient_name,
        value,
        unit,
        daily_value_percent
      FROM recipe_nutrition
      WHERE recipe_id = $1
      ORDER BY nutrient_name ASC
      `,
      [recipe.id],
    );

    /*
     * INSTRUCTIONS
     */
    const instructionsRes = await pool.query(
      `
      SELECT
        instruction_id,
        step_number,
        step_title,
        step_description,
        duration_minutes
      FROM recipe_instructions
      WHERE recipe_id = $1
      ORDER BY step_number ASC
      `,
      [recipe.id],
    );

    /*
     * RELATED RECIPES
     */
    const related = await pool.query(
      `
      SELECT
        id,
        title,
        slug,
        thumbnail_url

      FROM recipes

      WHERE
        category_id = $1
        AND id != $2
        AND status = 'published'

      ORDER BY created_at DESC

      LIMIT 4
      `,
      [recipe.category_id, recipe.id],
    );

    return NextResponse.json({
      success: true,

      item: {
        ...recipe,

        instructions: instructionsRes.rows,
        ingredients: ingredientsRes.rows,
        nutrition: nutritionRes.rows,
        relatedRecipes: related.rows,
      },
    });
  } catch (error: any) {
    console.error("GET RECIPE DETAIL ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch recipe",
      },
      {
        status: 500,
      },
    );
  }
}
