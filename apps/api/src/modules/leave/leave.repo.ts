import { pool } from "../../config/db";
import type { CreateLeaveInput, UpdateLeaveInput } from "./leave.validation";

function calcDays(from_date: string, to_date: string): number {
  const from = new Date(from_date);
  const to = new Date(to_date);
  const diff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(diff, 1);
}

export async function createLeaveRequest(data: CreateLeaveInput) {
  const days = calcDays(data.from_date, data.to_date);
  const res = await pool.query(
    `INSERT INTO leave_requests (employee_id, type, from_date, to_date, days, reason)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING *`,
    [data.employee_id, data.type, data.from_date, data.to_date, days, data.reason ?? null]
  );
  return res.rows[0];
}

export async function listLeaveRequests(filters: {
  employee_id?: string;
  status?: string;
  from?: string;
  to?: string;
}) {
  const conditions: string[] = [];
  const values: any[] = [];
  let i = 1;

  if (filters.employee_id) { conditions.push(`lr.employee_id = $${i++}`); values.push(filters.employee_id); }
  if (filters.status) { conditions.push(`lr.status = $${i++}`); values.push(filters.status); }
  if (filters.from) { conditions.push(`lr.from_date >= $${i++}::date`); values.push(filters.from); }
  if (filters.to) { conditions.push(`lr.to_date <= $${i++}::date`); values.push(filters.to); }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const res = await pool.query(
    `SELECT lr.*, e.first_name, e.last_name, e.employee_number
     FROM leave_requests lr
     JOIN employees e ON e.id = lr.employee_id
     ${where}
     ORDER BY lr.created_at DESC`,
    values
  );
  return res.rows;
}

export async function getLeaveRequestById(id: string) {
  const res = await pool.query(
    `SELECT lr.*, e.first_name, e.last_name, e.employee_number
     FROM leave_requests lr
     JOIN employees e ON e.id = lr.employee_id
     WHERE lr.id = $1`,
    [id]
  );
  return res.rows[0] ?? null;
}

export async function updateLeaveRequestById(id: string, data: UpdateLeaveInput) {
  const fields: string[] = [];
  const values: any[] = [];
  let i = 1;

  if (data.type !== undefined) { fields.push(`type = $${i++}`); values.push(data.type); }
  if (data.from_date !== undefined) { fields.push(`from_date = $${i++}`); values.push(data.from_date); }
  if (data.to_date !== undefined) { fields.push(`to_date = $${i++}`); values.push(data.to_date); }
  if (data.reason !== undefined) { fields.push(`reason = $${i++}`); values.push(data.reason); }

  if (data.from_date || data.to_date) {
    const current = await getLeaveRequestById(id);
    if (current) {
      const from = data.from_date ?? current.from_date;
      const to = data.to_date ?? current.to_date;
      const days = calcDays(from, to);
      fields.push(`days = $${i++}`);
      values.push(days);
    }
  }

  if (fields.length === 0) return null;

  fields.push(`updated_at = now()`);
  values.push(id);

  const res = await pool.query(
    `UPDATE leave_requests SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`,
    values
  );
  return res.rows[0] ?? null;
}

export async function approveLeaveRequest(id: string, reviewed_by: string) {
  const res = await pool.query(
    `UPDATE leave_requests
     SET status = 'approved', reviewed_by = $2, reviewed_at = now(), updated_at = now()
     WHERE id = $1 AND status = 'pending'
     RETURNING *`,
    [id, reviewed_by]
  );
  return res.rows[0] ?? null;
}

export async function rejectLeaveRequest(id: string, reviewed_by: string) {
  const res = await pool.query(
    `UPDATE leave_requests
     SET status = 'rejected', reviewed_by = $2, reviewed_at = now(), updated_at = now()
     WHERE id = $1 AND status = 'pending'
     RETURNING *`,
    [id, reviewed_by]
  );
  return res.rows[0] ?? null;
}

export async function cancelLeaveRequest(id: string) {
  const res = await pool.query(
    `UPDATE leave_requests
     SET status = 'cancelled', updated_at = now()
     WHERE id = $1 AND status IN ('pending', 'approved')
     RETURNING *`,
    [id]
  );
  return res.rows[0] ?? null;
}