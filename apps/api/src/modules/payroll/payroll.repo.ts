import { pool } from "../../config/db";
import type { CreatePayrollInput, UpdatePayrollInput } from "./payroll.validation";

export async function createPayroll(data: CreatePayrollInput) {
  const net_salary = data.basic_salary + data.allowances - data.deductions;

  const res = await pool.query(
    `INSERT INTO payroll
      (employee_id, month, year, basic_salary, allowances, deductions, net_salary, note)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [
      data.employee_id,
      data.month,
      data.year,
      data.basic_salary,
      data.allowances,
      data.deductions,
      net_salary,
      data.note ?? null,
    ]
  );
  return res.rows[0];
}

export async function listPayroll(filters: {
  employee_id?: string;
  month?: number;
  year?: number;
  status?: string;
}) {
  const conditions: string[] = [];
  const values: any[] = [];
  let i = 1;

  if (filters.employee_id) { conditions.push(`p.employee_id = $${i++}`); values.push(filters.employee_id); }
  if (filters.month) { conditions.push(`p.month = $${i++}`); values.push(filters.month); }
  if (filters.year) { conditions.push(`p.year = $${i++}`); values.push(filters.year); }
  if (filters.status) { conditions.push(`p.status = $${i++}`); values.push(filters.status); }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const res = await pool.query(
    `SELECT p.*, e.first_name, e.last_name, e.employee_number, e.designation
     FROM payroll p
     JOIN employees e ON e.id = p.employee_id
     ${where}
     ORDER BY p.year DESC, p.month DESC, e.first_name ASC`,
    values
  );
  return res.rows;
}

export async function getPayrollById(id: string) {
  const res = await pool.query(
    `SELECT p.*, e.first_name, e.last_name, e.employee_number, e.designation
     FROM payroll p
     JOIN employees e ON e.id = p.employee_id
     WHERE p.id = $1`,
    [id]
  );
  return res.rows[0] ?? null;
}

export async function updatePayrollById(id: string, data: UpdatePayrollInput) {
  // Get current payroll to recalculate net salary
  const current = await getPayrollById(id);
  if (!current) return null;

  const basic = data.basic_salary ?? current.basic_salary;
  const allowances = data.allowances ?? current.allowances;
  const deductions = data.deductions ?? current.deductions;
  const net_salary = Number(basic) + Number(allowances) - Number(deductions);

  const fields: string[] = [];
  const values: any[] = [];
  let i = 1;

  if (data.basic_salary !== undefined) { fields.push(`basic_salary = $${i++}`); values.push(data.basic_salary); }
  if (data.allowances !== undefined) { fields.push(`allowances = $${i++}`); values.push(data.allowances); }
  if (data.deductions !== undefined) { fields.push(`deductions = $${i++}`); values.push(data.deductions); }
  if (data.note !== undefined) { fields.push(`note = $${i++}`); values.push(data.note); }

  fields.push(`net_salary = $${i++}`);
  values.push(net_salary);
  fields.push(`updated_at = now()`);
  values.push(id);

  const res = await pool.query(
    `UPDATE payroll SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`,
    values
  );
  return res.rows[0] ?? null;
}

export async function approvePayroll(id: string) {
  const res = await pool.query(
    `UPDATE payroll SET status = 'approved', updated_at = now()
     WHERE id = $1 AND status = 'draft'
     RETURNING *`,
    [id]
  );
  return res.rows[0] ?? null;
}

export async function markPayrollPaid(id: string) {
  const res = await pool.query(
    `UPDATE payroll SET status = 'paid', paid_at = now(), updated_at = now()
     WHERE id = $1 AND status = 'approved'
     RETURNING *`,
    [id]
  );
  return res.rows[0] ?? null;
}

export async function getPayrollSummary(month: number, year: number) {
  const res = await pool.query(
    `SELECT
       COUNT(*) AS total_employees,
       COUNT(*) FILTER (WHERE status = 'paid') AS paid,
       COUNT(*) FILTER (WHERE status = 'approved') AS approved,
       COUNT(*) FILTER (WHERE status = 'draft') AS draft,
       COALESCE(SUM(net_salary), 0) AS total_payroll,
       COALESCE(SUM(net_salary) FILTER (WHERE status = 'paid'), 0) AS total_paid
     FROM payroll
     WHERE month = $1 AND year = $2`,
    [month, year]
  );
  return res.rows[0];
}