// app/api/account/recipes/route.ts

import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth";
import { webAuthOptions } from "@/core/auth";

import { pool } from "@/core/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(webAuthOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 12);
    const search = searchParams.get("search") || "";

    const offset = (page - 1) * limit;

    const values: any[] = [session?.user?.id];

    const where: string[] = [`r.customer_id = $1`];

    /*
     * SEARCH
     */
    if (search) {
      values.push(`%${search}%`);

      where.push(`
        (
          r.title ILIKE $${values.length}
          OR r.short_description ILIKE $${values.length}
        )
      `);
    }

    const whereClause = `WHERE ${where.join(" AND ")}`;

    /*
     * TOTAL
     */
    const totalRes = await pool.query(
      `
      SELECT COUNT(*)::int AS total
      FROM recipes r
      ${whereClause}
      `,
      values,
    );

    const total = totalRes.rows[0]?.total || 0;

    /*
     * DATA
     */
    values.push(limit);
    values.push(offset);

    const { rows } = await pool.query(
      `
      SELECT
        r.id,
        r.title,
        r.slug,
        r.short_description,
        r.thumbnail_url,
        r.youtube_url,
        r.status,
        r.created_at
      FROM recipes r
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT $${values.length - 1}
      OFFSET $${values.length}
      `,
      values,
    );

    return NextResponse.json({
      success: true,
      items: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("ACCOUNT RECIPES GET ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch recipes",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(webAuthOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    //   const client = await pool.connect();

    const body = await req.json();

    const {
      title,
      slug,
      short_description,
      thumbnail_url,
      youtube_url,
      content,
      tag_ids = [],
    } = body;

    /*
     * VALIDATION
     */
    if (!title || !slug || !content) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * INSERT RECIPE
     */
    const recipeRes = await pool.query(
      `
      INSERT INTO recipes (
        customer_id,
        title,
        slug,
        short_description,
        thumbnail_url,
        youtube_url,
        content,
        status,
        created_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        'draft',
        NOW()
      )
      RETURNING id
      `,
      [
        session.user.id,
        title,
        slug,
        short_description || null,
        thumbnail_url || null,
        youtube_url || null,
        content,
      ],
    );

    const recipeId = recipeRes.rows[0].id;

    /*
     * INSERT TAGS
     */
    if (Array.isArray(tag_ids)) {
      for (const tagId of tag_ids) {
        await pool.query(
          `
          INSERT INTO recipe_recipe_tags (
            recipe_id,
            tag_id
          )
          VALUES ($1, $2)
          `,
          [recipeId, tagId],
        );
      }
    }

    return NextResponse.json({
      success: true,
      id: recipeId,
    });
  } catch (error: any) {
    console.error("CREATE RECIPE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create recipe",
      },
      {
        status: 500,
      },
    );
  }
}
