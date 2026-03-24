import { pool } from "../../config/db";
import type { CreateEmployeeInput, UpdateEmployeeInput } from "./employee.validation";

// Auto generate employee number e.g. EMP-0001
async function generateEmployeeNumber(): Promise<string> {
  const res = await pool.query(`SELECT COUNT(*) FROM employees`);
  const count = parseInt(res.rows[0].count, 10) + 1;
  return `EMP-${String(count).padStart(4, "0")}`;
}

export async function createEmployee(data: CreateEmployeeInput) {
  const employee_number = await generateEmployeeNumber();

  const res = await pool.query(
    `INSERT INTO employees
      (employee_number, first_name, last_name, email, phone, department_id,
       designation, employment_type, status, join_date, basic_salary)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING *`,
    [
      employee_number,
      data.first_name,
      data.last_name,
      data.email,
      data.phone ?? null,
      data.department_id ?? null,
      data.designation ?? null,
      data.employment_type,
      data.status,
      data.join_date ?? new Date().toISOString().slice(0, 10),
      data.basic_salary,
    ]
  );
  return res.rows[0];
}

export async function listEmployees() {
  const res = await pool.query(
    `SELECT e.*, d.name AS department_name
     FROM employees e
     LEFT JOIN departments d ON d.id = e.department_id
     ORDER BY e.created_at DESC`
  );
  return res.rows;
}

export async function getEmployeeById(id: string) {
  const res = await pool.query(
    `SELECT e.*, d.name AS department_name
     FROM employees e
     LEFT JOIN departments d ON d.id = e.department_id
     WHERE e.id = $1`,
    [id]
  );
  return res.rows[0] ?? null;
}

export async function updateEmployeeById(id: string, data: UpdateEmployeeInput) {
  const fields: string[] = [];
  const values: any[] = [];
  let i = 1;

  if (data.first_name !== undefined) { fields.push(`first_name = $${i++}`); values.push(data.first_name); }
  if (data.last_name !== undefined) { fields.push(`last_name = $${i++}`); values.push(data.last_name); }
  if (data.email !== undefined) { fields.push(`email = $${i++}`); values.push(data.email); }
  if (data.phone !== undefined) { fields.push(`phone = $${i++}`); values.push(data.phone); }
  if (data.department_id !== undefined) { fields.push(`department_id = $${i++}`); values.push(data.department_id); }
  if (data.designation !== undefined) { fields.push(`designation = $${i++}`); values.push(data.designation); }
  if (data.employment_type !== undefined) { fields.push(`employment_type = $${i++}`); values.push(data.employment_type); }
  if (data.status !== undefined) { fields.push(`status = $${i++}`); values.push(data.status); }
  if (data.join_date !== undefined) { fields.push(`join_date = $${i++}`); values.push(data.join_date); }
  if (data.basic_salary !== undefined) { fields.push(`basic_salary = $${i++}`); values.push(data.basic_salary); }

  if (fields.length === 0) return null;

  fields.push(`updated_at = now()`);
  values.push(id);

  const res = await pool.query(
    `UPDATE employees SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`,
    values
  );
  return res.rows[0] ?? null;
}

export async function deleteEmployeeById(id: string) {
  const res = await pool.query(
    `DELETE FROM employees WHERE id = $1 RETURNING id`,
    [id]
  );
  return { deleted: (res.rowCount ?? 0) > 0 };
}

// Departments
export async function listDepartments() {
  const res = await pool.query(`SELECT * FROM departments ORDER BY name`);
  return res.rows;
}

export async function createDepartment(name: string) {
  const res = await pool.query(
    `INSERT INTO departments (name) VALUES ($1) RETURNING *`,
    [name]
  );
  return res.rows[0];
}