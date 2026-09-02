import { pool } from "@/core/db";

export const testimonials = async (
  name: string,
  email: string,
  comment: string,
  rating: number,
  product_id: string,
) => {
  try {
    const query = `
      INSERT INTO store_product_reviews (
        product_id,
        rating,
        comment,
        guest_name,
        status
      )
      VALUES ($1, $2, $3, $4, 'pending')
      RETURNING *;
    `;

    const values = [
      product_id,
      Math.max(1, Math.min(5, Math.round(Number(rating) || 0))),
      comment.trim(),
      name.trim() || email.trim() || "Anonymous",
    ];

    const result = await pool.query(query, values);

    return { success: true, data: result.rows[0] };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
};
