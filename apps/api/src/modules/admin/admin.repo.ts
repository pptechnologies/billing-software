import { pool } from "../../config/db";

export async function getAllUsers() {
  const result = await pool.query(
    `SELECT id, email, role, created_at
     FROM users
     ORDER BY created_at DESC`
  );
  return result.rows;
}

export async function updateUserRole(userId: string, role: "admin" | "user") {
   const result = await pool.query(
    `
    UPDATE users
    SET role = $2, updated_at = now()
    WHERE id = $1
    RETURNING id, email, role
    `,
    [userId, role]
  );

  return result.rows[0] ?? null;
} 
