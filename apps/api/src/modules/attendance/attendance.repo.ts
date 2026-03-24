import { pool } from "../../config/db";
import type { MarkAttendanceInput, UpdateAttendanceInput } from "./attendance.validation";

export async function markAttendance(data: MarkAttendanceInput) {
  // Upsert — if record exists for same employee+date, update it
  const res = await pool.query(
    `INSERT INTO attendance (employee_id, date, status, check_in, check_out, note)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (employee_id, date)
     DO UPDATE SET
       status = EXCLUDED.status,
       check_in = EXCLUDED.check_in,
       check_out = EXCLUDED.check_out,
       note = EXCLUDED.note,
       updated_at = now()
     RETURNING *`,
    [
      data.employee_id,
      data.date,
      data.status,
      data.check_in ?? null,
      data.check_out ?? null,
      data.note ?? null,
    ]
  );
  return res.rows[0];
}

export async function listAttendance(filters: {
  employee_id?: string;
  from?: string;
  to?: string;
}) {
  const conditions: string[] = [];
  const values: any[] = [];
  let i = 1;

  if (filters.employee_id) {
    conditions.push(`a.employee_id = $${i++}`);
    values.push(filters.employee_id);
  }
  if (filters.from) {
    conditions.push(`a.date >= $${i++}::date`);
    values.push(filters.from);
  }
  if (filters.to) {
    conditions.push(`a.date <= $${i++}::date`);
    values.push(filters.to);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const res = await pool.query(
    `SELECT a.*, e.first_name, e.last_name, e.employee_number
     FROM attendance a
     JOIN employees e ON e.id = a.employee_id
     ${where}
     ORDER BY a.date DESC, e.first_name ASC`,
    values
  );
  return res.rows;
}

export async function getAttendanceById(id: string) {
  const res = await pool.query(
    `SELECT a.*, e.first_name, e.last_name, e.employee_number
     FROM attendance a
     JOIN employees e ON e.id = a.employee_id
     WHERE a.id = $1`,
    [id]
  );
  return res.rows[0] ?? null;
}

export async function updateAttendanceById(id: string, data: UpdateAttendanceInput) {
  const fields: string[] = [];
  const values: any[] = [];
  let i = 1;

  if (data.status !== undefined) { fields.push(`status = $${i++}`); values.push(data.status); }
  if (data.check_in !== undefined) { fields.push(`check_in = $${i++}`); values.push(data.check_in); }
  if (data.check_out !== undefined) { fields.push(`check_out = $${i++}`); values.push(data.check_out); }
  if (data.note !== undefined) { fields.push(`note = $${i++}`); values.push(data.note); }

  if (fields.length === 0) return null;

  fields.push(`updated_at = now()`);
  values.push(id);

  const res = await pool.query(
    `UPDATE attendance SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`,
    values
  );
  return res.rows[0] ?? null;
}

export async function getAttendanceSummary(employee_id: string, month: number, year: number) {
  const res = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'present') AS present,
       COUNT(*) FILTER (WHERE status = 'absent') AS absent,
       COUNT(*) FILTER (WHERE status = 'half_day') AS half_day,
       COUNT(*) FILTER (WHERE status = 'leave') AS on_leave,
       COUNT(*) FILTER (WHERE status = 'holiday') AS holiday,
       COUNT(*) AS total
     FROM attendance
     WHERE employee_id = $1
       AND EXTRACT(MONTH FROM date) = $2
       AND EXTRACT(YEAR FROM date) = $3`,
    [employee_id, month, year]
  );
  return res.rows[0];
}