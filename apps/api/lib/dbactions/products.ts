// apps/web/lib/dbactions/products.ts

import { pool } from "@/core/db";

/** Expects the raw search term (no % wildcards). Works without a brands join. */
function productSearchSql(index: number) {
  return ` AND (
    COALESCE(p.search_vector, ''::tsvector) @@ plainto_tsquery('english', $${index})
    OR p.name ILIKE '%' || $${index} || '%'
    OR COALESCE(p.sku, '') ILIKE '%' || $${index} || '%'
    OR COALESCE(p.slug, '') ILIKE '%' || $${index} || '%'
    OR COALESCE(p.description, '') ILIKE '%' || $${index} || '%'
    OR COALESCE(p.health_benefits, '') ILIKE '%' || $${index} || '%'
    OR COALESCE(c.name, '') ILIKE '%' || $${index} || '%'
    OR CAST(p.weight AS TEXT) ILIKE '%' || $${index} || '%'
    OR (COALESCE(p.name, '') || ' ' || COALESCE(CAST(p.weight AS TEXT), '')) ILIKE '%' || $${index} || '%'
    OR EXISTS (
      SELECT 1
      FROM store_brands sb
      WHERE sb.brand_id = p.brand_id
        AND sb.name ILIKE '%' || $${index} || '%'
    )
    OR (
      SELECT COALESCE(bool_and(
        (COALESCE(p.name, '') || ' ' || COALESCE(CAST(p.weight AS TEXT), '') || ' ' || COALESCE(c.name, ''))
          ILIKE '%' || w.word || '%'
      ), false)
      FROM unnest(regexp_split_to_array(trim($${index}), '[[:space:]]+')) AS w(word)
      WHERE length(trim(w.word)) > 0
    )
  )`;
}

function productSearchRankSql(index: number) {
  return `GREATEST(
    ts_rank(COALESCE(p.search_vector, ''::tsvector), plainto_tsquery('english', $${index})),
    CASE WHEN p.name ILIKE '%' || $${index} || '%' THEN 1 ELSE 0 END,
    CASE WHEN EXISTS (
      SELECT 1 FROM store_brands sb
      WHERE sb.brand_id = p.brand_id AND sb.name ILIKE '%' || $${index} || '%'
    ) THEN 0.9 ELSE 0 END,
    CASE WHEN CAST(p.weight AS TEXT) ILIKE '%' || $${index} || '%' THEN 0.8 ELSE 0 END,
    CASE WHEN (COALESCE(p.name, '') || ' ' || COALESCE(CAST(p.weight AS TEXT), '')) ILIKE '%' || $${index} || '%' THEN 1 ELSE 0 END
  ) AS rank`;
}

export const getProducts = async (filters: any) => {
  const {
    category,
    subcategories,
    brands,
    minPrice,
    maxPrice,
    search,
    sort = "newest",
    page = 1,
    saleOnly = false,
    limit = 20,
    countryCode = "NL",
  } = filters;

  let values: any[] = [String(countryCode || "NL").toUpperCase()];
  let index = 1;

  let searchParamIndex: number | null = null;
  if (search?.trim()) {
    index++;
    searchParamIndex = index;
    values.push(search.trim());
  }

  const rankField =
    searchParamIndex !== null
      ? productSearchRankSql(searchParamIndex)
      : "0 as rank";

  // Match web: include country catalog min_offered_price for pricing parity
  let query = `
    SELECT 
      p.*, 
      c.slug as category_slug,
      c.name AS category_name,
      b.name AS brand_name,
      img.file_url AS image,
      cat.min_offered_price,
      ${rankField}
    FROM store_products p
    LEFT JOIN (
      SELECT
        spc.product_id,
        MIN(spc.price) AS min_offered_price
      FROM public.store_product_catalog spc
      INNER JOIN public.store_settings ss ON ss.store_id = spc.store_id
      WHERE ss.country_code = $1 AND spc.status = 1
      GROUP BY spc.product_id
    ) cat ON cat.product_id = p.id
    LEFT JOIN store_categories c ON c.id = p.category_id
    LEFT JOIN store_brands b ON b.brand_id = p.brand_id
    LEFT JOIN (
      SELECT DISTINCT ON (pi.product_id) 
        pi.product_id, 
        md.file_url
      FROM store_product_images pi
      LEFT JOIN media md ON md.media_id = pi.url::int
      ORDER BY pi.product_id, pi.is_primary DESC, pi.id ASC
    ) img ON img.product_id = p.id
    WHERE p.status = 1
  `;

  if (saleOnly) {
    query += ` AND (
      (p.discount_type IS NOT NULL AND p.discount_value::text != 'NaN' AND p.discount_value > 0)
      OR (p.sale_price IS NOT NULL AND p.sale_price < p.base_price)
    ) AND (p.promo_code IS NULL OR p.promo_code = '')`;
  }

  // 🔹 Category ("all" means search across every category)
  if (category && category !== "all" && !saleOnly) {
    index++;
    query += ` AND c.slug = $${index}`;
    values.push(category);
  }

  // 🔹 Subcategories
  if (subcategories?.length > 0) {
    index++;
    query += ` AND p.subcategory_id = ANY($${index}::uuid[])`;
    values.push(subcategories);
  }

  // 🔹 Brands
  if (brands?.length > 0) {
    index++;
    query += ` AND p.brand_id = ANY($${index}::uuid[])`;
    values.push(brands);
  }
  // 🔹 Price (GLOBAL BASE PRICE or fallback logic later)
  if (minPrice) {
    index++;
    query += ` AND p.base_price >= $${index}`;
    values.push(minPrice);
  }

  if (maxPrice) {
    index++;
    query += ` AND p.base_price <= $${index}`;
    values.push(maxPrice);
  }
  if (searchParamIndex !== null) {
    query += productSearchSql(searchParamIndex);
  }

  // 🔥 Sorting — prefer relevance whenever a search query is active
  switch (sort) {
    case "price_asc":
      query += ` ORDER BY p.base_price ASC, p.id DESC`;
      break;

    case "price_desc":
      query += ` ORDER BY p.base_price DESC, p.id DESC`;
      break;

    case "popular":
      query += searchParamIndex !== null
        ? ` ORDER BY rank DESC, p.created_at DESC, p.id DESC`
        : ` ORDER BY p.created_at DESC, p.id DESC`;
      break;

    case "relevance":
      query += searchParamIndex !== null
        ? ` ORDER BY rank DESC, p.id DESC`
        : ` ORDER BY p.created_at DESC, p.id DESC`;
      break;

    default:
      query += searchParamIndex !== null
        ? ` ORDER BY rank DESC, p.created_at DESC, p.id DESC`
        : ` ORDER BY p.created_at DESC, p.id DESC`;
  }

  // 🔥 Pagination
  // const limit = 20;
  const offset = (page - 1) * limit;

  index++;
  query += ` LIMIT $${index}`;
  values.push(limit);

  index++;
  query += ` OFFSET $${index}`;
  values.push(offset);

  // console.log("query ====", query);
  // console.log("values ====", values);

  const result = await pool.query(query, values);
  return result.rows;
};

export const getProductById = async (productId: string, countryCode = "NL") => {
  const query = `
    SELECT 
      p.*, 
      c.slug as category_slug,
      c.name AS category_name,
      b.name AS brand_name,
      img.file_url AS image,
      cat.min_offered_price,
      0 as rank
    FROM store_products p
    LEFT JOIN (
      SELECT
        spc.product_id,
        MIN(spc.price) AS min_offered_price
      FROM public.store_product_catalog spc
      INNER JOIN public.store_settings ss ON ss.store_id = spc.store_id
      WHERE ss.country_code = $2 AND spc.status = 1
      GROUP BY spc.product_id
    ) cat ON cat.product_id = p.id
    LEFT JOIN store_categories c ON c.id = p.category_id
    LEFT JOIN store_brands b ON b.brand_id = p.brand_id
    LEFT JOIN (
      SELECT DISTINCT ON (pi.product_id) 
        pi.product_id, 
        md.file_url
      FROM store_product_images pi
      LEFT JOIN media md ON md.media_id = pi.url::int
      ORDER BY pi.product_id, pi.is_primary DESC, pi.id ASC
    ) img ON img.product_id = p.id
    WHERE p.id = $1
    LIMIT 1
  `;

  const result = await pool.query(query, [
    productId,
    String(countryCode || "NL").toUpperCase(),
  ]);
  return result.rows[0] ?? null;
};

export const getProductsCount = async (filters: any) => {
  const {
    category,
    subcategories,
    brands,
    minPrice,
    maxPrice,
    search,
    saleOnly = false,
  } = filters;

  let values: any[] = [];
  let index = 0;

  let query = `
    SELECT COUNT(DISTINCT p.id)::int AS total
    FROM store_products p
    LEFT JOIN store_categories c ON c.id = p.category_id
    WHERE p.status = 1
  `;

  if (saleOnly) {
    query += ` AND (
      (p.discount_type IS NOT NULL AND p.discount_value::text != 'NaN' AND p.discount_value > 0)
      OR (p.sale_price IS NOT NULL AND p.sale_price < p.base_price)
    ) AND (p.promo_code IS NULL OR p.promo_code = '')`;
  }

  if (category && category !== "all" && !saleOnly) {
    index++;
    query += ` AND c.slug = $${index}`;
    values.push(category);
  }

  if (subcategories?.length > 0) {
    index++;
    query += ` AND p.subcategory_id = ANY($${index}::uuid[])`;
    values.push(subcategories);
  }

  if (brands?.length > 0) {
    index++;
    query += ` AND p.brand_id = ANY($${index}::uuid[])`;
    values.push(brands);
  }

  if (minPrice) {
    index++;
    query += ` AND p.base_price >= $${index}`;
    values.push(minPrice);
  }

  if (maxPrice) {
    index++;
    query += ` AND p.base_price <= $${index}`;
    values.push(maxPrice);
  }

  if (search?.trim()) {
    index++;
    values.push(search.trim());
    query += productSearchSql(index);
  }

  const result = await pool.query(query, values);
  return Number(result.rows[0]?.total ?? 0);
};

export const getProductBySlug = async (slug: string) => {
  const query = `
    SELECT 
      p.*,
      c.name AS category_name,

      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'id', pi.id,
            'url', m.file_url,
            'is_primary', pi.is_primary
          )
        ) FILTER (WHERE pi.id IS NOT NULL),
        '[]'
      ) AS images

    FROM store_products p
    LEFT JOIN store_categories c 
      ON p.category_id = c.id

    LEFT JOIN store_product_images pi 
      ON pi.product_id = p.id

    LEFT JOIN media m 
      ON m.media_id = pi.url::int

    WHERE p.slug = $1
    GROUP BY p.id, c.name
    LIMIT 1
  `;

  const result = await pool.query(query, [slug]);

  const row = result.rows[0];

  if (!row) return null;

  return {
    ...row,
    images: row.images || [],
    highlights: row.highlights || [],
  };
};

export const getRelatedProducts = async (category_id: string) => {
  const query = `
    SELECT 
      p.id,
      p.name,
      p.slug,
      p.base_price,
      p.category_id,
      c.slug AS category_slug,
      md.file_url AS image
    FROM store_products p
    LEFT JOIN store_categories c ON c.id = p.category_id
    LEFT JOIN store_product_images pi 
      ON pi.product_id = p.id AND pi.is_primary = true
    LEFT JOIN media md ON md.media_id = pi.url::int
    WHERE p.category_id = $1
    ORDER BY p.created_at DESC
    LIMIT 12
  `;

  const result = await pool.query(query, [category_id]);
  return result.rows;
};

export const getProductReviews = async (productId: string, page = 1) => {
  const limit = 5;
  const offset = (page - 1) * limit;

  const reviewsQuery = `
    SELECT 
      r.id,
      r.rating,
      r.title,
      r.comment,
      r.created_at,
      r.status,
      COALESCE(c.company_name, r.guest_name, 'Anonymous') as name
    FROM store_product_reviews r
    Left JOIN store_customers c ON r.customer_id = c.id
    WHERE r.product_id = $1
    ORDER BY r.created_at DESC
    LIMIT $2 OFFSET $3
  `;

  const statsQuery = `
    SELECT 
      COUNT(*)::int as total,
      ROUND(AVG(rating)::numeric, 1) as avg
    FROM store_product_reviews
    WHERE product_id = $1
  `;

  const breakdownQuery = `
    SELECT rating, COUNT(*)::int as count
    FROM store_product_reviews
    WHERE product_id = $1
    GROUP BY rating
  `;

  const [reviewsRes, statsRes, breakdownRes] = await Promise.all([
    pool.query(reviewsQuery, [productId, limit, offset]),
    pool.query(statsQuery, [productId]),
    pool.query(breakdownQuery, [productId]),
  ]);

  return {
    reviews: reviewsRes.rows,
    total: statsRes.rows[0]?.total || 0,
    average: statsRes.rows[0]?.avg || 0,
    breakdown: breakdownRes.rows,
  };
};

export const getAllApprovedReviews = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const query = `
    SELECT
      r.id,
      r.rating,
      r.comment,
      COALESCE(c.company_name, r.guest_name, 'Anonymous') AS guest_name,
      r.status
    FROM store_product_reviews r
    LEFT JOIN store_customers c ON r.customer_id = c.id
    ORDER BY r.created_at DESC
    LIMIT $1 OFFSET $2
  `;

  const result = await pool.query(query, [limit, offset]);
  return result.rows;
};

export const getSubcategories = async (category: string, filters: any = {}) => {
  const { brands, minPrice, maxPrice, search } = filters;

  let values: any[] = [category];
  let index = 1;

  // Base conditions for filtering the counted products
  let productConditions = `p.status = 1`;

  // 🔹 Brand Constraint (Scoped strictly to product selection)
  if (brands?.length > 0) {
    index++;
    productConditions += ` AND p.brand_id = ANY($${index}::uuid[])`;
    values.push(brands);
  }

  // 🔹 Price Range Constraints
  if (minPrice) {
    index++;
    productConditions += ` AND p.base_price >= $${index}`;
    values.push(minPrice);
  }

  if (maxPrice) {
    index++;
    productConditions += ` AND p.base_price <= $${index}`;
    values.push(maxPrice);
  }

  // 🔹 Text Search Constraint
  if (search?.trim()) {
    index++;
    values.push(search.trim());
    productConditions += productSearchSql(index);
  }

  // We build a clean query where c.slug filter is absolute,
  // and the dynamic product filters ONLY apply inside the join predicate.
  const query = `
    SELECT 
      sc.id,
      sc.name,
      COUNT(DISTINCT p.id) AS product_count
    FROM store_subcategories sc
    INNER JOIN store_categories c 
      ON sc.category_id = c.id
      AND c.status = 1
    LEFT JOIN store_products p 
      ON p.subcategory_id = sc.id 
      AND ${productConditions}
    WHERE c.slug = $1
      AND sc.status = 1
    GROUP BY sc.id, sc.name
    ORDER BY sc.name;
  `;

  // console.log("productConditions ==== ", productConditions);
  // console.log("query ==== ", query);
  // console.log("values ==== ", values);

  const result = await pool.query(query, values);
  return result.rows;
};

export const getBrands = async (category: string, filters: any = {}) => {
  const { subcategories, minPrice, maxPrice, search } = filters;

  let values: any[] = [category];
  let index = 1;
  let conditions = `c.slug = $1 AND p.brand_id IS NOT NULL`;

  if (subcategories?.length > 0) {
    index++;
    conditions += ` AND p.subcategory_id = ANY($${index}::uuid[])`;
    values.push(subcategories);
  }

  if (minPrice !== undefined && minPrice !== "") {
    index++;
    conditions += ` AND p.base_price >= $${index}`;
    values.push(minPrice);
  }

  if (maxPrice !== undefined && maxPrice !== "") {
    index++;
    conditions += ` AND p.base_price <= $${index}`;
    values.push(maxPrice);
  }

  if (search?.trim()) {
    index++;
    values.push(search.trim());
    conditions += productSearchSql(index);
  }

  const query = `
    SELECT
      p.brand_id,
      COALESCE(b.name, 'Unknown Brand') AS name,
      COUNT(DISTINCT p.id)::int AS product_count
    FROM store_products p
    INNER JOIN store_categories c ON c.id = p.category_id
    LEFT JOIN store_brands b ON b.brand_id = p.brand_id
    WHERE ${conditions}
    GROUP BY p.brand_id, b.name
    ORDER BY name
  `;

  const result = await pool.query(query, values);

  return result.rows;
};

/* export const getBrands = async (category: string, filters: any = {}) => {


  let values: any[] = [category];

  const query = `
    SELECT
        b.brand_id,
        b.name,
        COUNT(DISTINCT p.id) AS product_count
    FROM store_brands b
    LEFT JOIN store_products p
        ON p.brand_id = b.brand_id
        AND p.status = 1
    LEFT JOIN store_categories c
        ON c.id = p.category_id
    WHERE c.slug = $1
    GROUP BY b.brand_id, b.name
    ORDER BY b.name;
  `;

  console.log("query ==== ", query);

  const result = await pool.query(query);
  return result.rows;
}; */

// console.log('query ==== ',query);
// const query = `
//   SELECT
//     b.brand_id,
//     b.name,
//     COUNT(p.id) AS product_count
//   FROM store_brands b
//   LEFT JOIN store_products p
//     ON p.brand_id = b.brand_id
//     AND p.status = 1
//   GROUP BY b.brand_id, b.name
//   ORDER BY b.name;
// `;

// if (search) {
//   values.push(search);
//   index = values.length;
// }
// let query = `
//   SELECT
//     p.*,
//     c.slug as category_slug,
//     md.file_url AS image,
//     ${
//       search
//         ? "ts_rank(p.search_vector, plainto_tsquery($1)) AS rank"
//         : "0 as rank"
//     }
//   FROM store_products p
//   LEFT JOIN store_categories c ON c.id = p.category_id
//   LEFT JOIN store_product_images pi
//     ON pi.product_id = p.id AND pi.is_primary = true
//   LEFT JOIN media md ON md.media_id = pi.url::int
//   WHERE 1=1
// `;

/* export const getSubcategories = async (category: string) => {
  const query = `
    SELECT 
      sc.id,
      sc.name,
      COUNT(p.id) AS product_count
    FROM store_subcategories sc
    INNER JOIN store_categories c 
      ON sc.category_id = c.id
    LEFT JOIN store_products p 
      ON p.subcategory_id = sc.id
      AND p.status = 1
    WHERE c.slug = $1
    GROUP BY sc.id, sc.name
    ORDER BY sc.name;
  `;

  const result = await pool.query(query, [category]);
  return result.rows;
}; */
/* 


    // 🔹 Subcategories
  if (subcategories?.length) {
    index++;
    query += ` AND p.subcategory_id = ANY($${index})`;
    values.push(subcategories);
  }

  // 🔹 Brands
  if (brands?.length) {
    index++;
    query += ` AND p.brand_id = ANY($${index})`;
    values.push(brands);
  }


  // 🔥 Full text search (correct position fix)
  // if (search) {
  //   index++;
  //   query += ` AND p.search_vector @@ plainto_tsquery($1)`;
  // }

const getProducts = async (category: string, categoryParam: string[] = []) => {
  try {
    let query = `
     SELECT sp.* 
      FROM store_products sp
      INNER JOIN store_categories c 
      ON sp.category_id = c.id
      WHERE c.slug = $1
    `;
    const values: any[] = [category];

    if (categoryParam.length > 0) {
      query += ` AND sp.subcategory_id = ANY($2)`;
      values.push(categoryParam);
    }

    const result = await pool.query(query, values);

    return result.rows;
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw new Error("Failed to fetch categories");
  }
};

export { getProducts };
 */

/* export const getProductBySlug = async (slug: string) => {
  const query = `
    SELECT p.*, c.name as category_name
    FROM store_products p
    LEFT JOIN store_categories c ON p.category_id = c.id
    LEFT JOIN store_product_images pi 
      ON pi.product_id = p.id
    WHERE p.slug = $1
    Limit 1
  `;

  console.log("query ==== ", query);
  console.log("slug ==== ", slug);

  const result = await pool.query(query, [slug]);

  return {
    ...result.rows[0],
    images: result.rows[0]?.images || [], // fallback
    highlights: result.rows[0]?.highlights || [],
  };
}; */

/* export const getRelatedProducts = async (category_id: string) => {
  const query = `
    SELECT *
    FROM store_products
    WHERE category_id = $1
    ORDER BY created_at DESC
    LIMIT 8
  `;

  const result = await pool.query(query, [category_id]);

  return result.rows;
}; */

export const getProductSeller = async (productId: string) => {
  const query = `
    SELECT
      s.id,
      s.name
    FROM store_product_catalog spc
    JOIN stores s ON s.id = spc.store_id
    WHERE spc.product_id = $1
      AND spc.status = 1
    ORDER BY s.is_default DESC NULLS LAST, spc.assigned_at ASC
    LIMIT 1
  `;

  const result = await pool.query(query, [productId]);
  return result.rows[0] ?? null;
};
