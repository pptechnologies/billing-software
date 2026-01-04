import { pool } from "../../config/db";
import type { CreateClientInput } from "./client.validation";

export async function createClient(input: CreateClientInput) {
  const r = await pool.query(
    `INSERT INTO clients
      (name, email, phone, address_line1, address_line2, city, country)
     VALUES
      ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [
      input.name,
      input.email ?? null,
      input.phone ?? null,
      input.address_line1 ?? null,
      input.address_line2 ?? null,
      input.city ?? null,
      input.country ?? null,
    ]
  );
  return r.rows[0];
}

export async function listClients() {
  const r = await pool.query(
    `SELECT * FROM clients ORDER BY created_at DESC LIMIT 100`
  );
  return r.rows;
}

export async function getClientById(id: string) {
  const r = await pool.query(`SELECT * FROM clients WHERE id=$1`, [id]);
  return r.rows[0] ?? null;
}
