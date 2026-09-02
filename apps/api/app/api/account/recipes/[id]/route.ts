// app/api/account/recipes/[id]route.ts

import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth";
import { webAuthOptions } from "@/core/auth";

import { pool } from "@/core/db";

// Replace with real auth later
async function getCurrentCustomer() {
  const session = await getServerSession(webAuthOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return session?.user?.id;
}

/*
 * GET SINGLE RECIPE
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const customerId = await getCurrentCustomer();
    const { id } = await req.json();

    const { rows } = await pool.query(
      `
      SELECT
        r.id,
        r.title,
        r.slug,
        r.short_description,
        r.content,
        r.thumbnail_url,
        r.youtube_url,
        r.youtube_video_id,
        r.status,
        r.created_at,

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

      LEFT JOIN recipe_recipe_tags rrt
        ON rrt.recipe_id = r.id

      LEFT JOIN recipe_tags rt
        ON rt.id = rrt.tag_id

      WHERE
        r.id = $1
        AND r.customer_id = $2

      GROUP BY r.id
      LIMIT 1
      `,
      [id, customerId],
    );

    const recipe = rows[0];

    if (!recipe) {
      return NextResponse.json(
        {
          success: false,
          error: "Recipe not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      item: recipe,
    });
  } catch (error: any) {
    console.error("ACCOUNT RECIPE GET ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch recipe",
      },
      { status: 500 },
    );
  }
}

/*
 * UPDATE RECIPE
 */

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const customerId = await getCurrentCustomer();

    const body = await req.json();

    const {
      title,
      slug,
      short_description,
      thumbnail_url,
      youtube_url,
      content,
    } = body;

    const result = await pool.query(
      `
      UPDATE recipes
      SET
        title = $1,
        slug = $2,
        short_description = $3,
        thumbnail_url = $4,
        youtube_url = $5,
        content = $6,
        updated_at = NOW()
      WHERE id = $7
      AND customer_id = $8
      RETURNING id
      `,
      [
        title,
        slug,
        short_description,
        thumbnail_url,
        youtube_url,
        content,
        body.id,
        customerId,
      ],
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Recipe not found or unauthorized",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Recipe updated successfully",
    });
  } catch (error: any) {
    console.error("ACCOUNT RECIPE UPDATE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update recipe",
      },
      { status: 500 },
    );
  }
}

/*
 * DELETE RECIPE
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const customerId = await getCurrentCustomer();

    const { id } = await req.json();

    const result = await pool.query(
      `
      DELETE FROM recipes
      WHERE id = $1
      AND customer_id = $2
      `,
      [id, customerId],
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Recipe not found or unauthorized",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Recipe deleted successfully",
    });
  } catch (error: any) {
    console.error("ACCOUNT RECIPE DELETE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete recipe",
      },
      { status: 500 },
    );
  }
}
