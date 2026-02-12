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

export async function countAdmins() {
  const result = await pool.query(
    `SELECT COUNT(*)::int AS count FROM users WHERE role = 'admin'`
  );

  return result.rows[0].count as number;
}

export async function updateUserStatus(userId: string, is_active: boolean) {
  const result = await pool.query(
    `
    UPDATE users
    SET is_active = $2,
        updated_at = now()
    WHERE id = $1
    RETURNING id, email, role, is_active
    `,
    [userId, is_active]
  );

  return result.rows[0] ?? null;
}

export async function createAuditLog(data: {
  actor_id: string;
  target_id: string;
  action: string;
  previous_value: string | null;
  new_value: string | null;
}) {
  await pool.query(
    `
    INSERT INTO admin_audit_logs
    (actor_id, target_id, action, previous_value, new_value)
    VALUES ($1, $2, $3, $4, $5)
    `,
    [
      data.actor_id,
      data.target_id,
      data.action,
      data.previous_value,
      data.new_value,
    ]
  );
}

