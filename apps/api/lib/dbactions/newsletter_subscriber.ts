import { pool } from "@/core/db";

export const subscribeUser = async (email: string) => {
  try {
    const query = `
      INSERT INTO newsletter_subscribers (email, status)
      VALUES ($1, 'subscribed')
      RETURNING *;
    `;

    const values = [email];

    const result = await pool.query(query, values);

    return { success: true, data: result.rows[0] };
  } catch (error: any) {
    // Handle duplicate email error
    if (error.code === "23505") {
      return { success: false, message: "Email already subscribed" };
    }

    return { success: false, message: error.message };
  }
};
