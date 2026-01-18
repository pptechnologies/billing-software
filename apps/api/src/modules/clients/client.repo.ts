import { pool } from "../../config/db";
import type { CreateClientInput } from "./client.validation";
import type { UpdateClientInput } from "./client.validation";

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


export async function updateClientById(id: string, input: UpdateClientInput) {
  const keys = Object.keys(input) as (keyof UpdateClientInput)[];

  if (keys.length === 0) {
    throw Object.assign(new Error("No fields to update"), { status: 400, code: "NoFields" });
  }

  const set: string[] = [];
  const params: any[] = [];
  let i = 1;

  for (const k of keys) {
    set.push(`${k} = $${i++}`);
    params.push((input as any)[k] ?? null);
  }


  set.push(`updated_at = now()`);

  params.push(id);

  const r = await pool.query(
    `UPDATE clients
     SET ${set.join(", ")}
     WHERE id = $${i}
     RETURNING *`,
    params
  );

  return r.rows[0] ?? null;
}

export async function deleteClientById(id: string) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const exists = await client.query(`SELECT id FROM clients WHERE id=$1`, [id]);
    if (!exists.rowCount) {
      await client.query("ROLLBACK");
      return { deleted: false, reason: "ClientNotFound" as const };
    }

    const invCount = await client.query(
      `SELECT COUNT(*)::int AS count FROM invoices WHERE client_id=$1`,
      [id]
    );

    const count = invCount.rows[0]?.count ?? 0;
    if (count > 0) {
      await client.query("ROLLBACK");
      return { deleted: false, reason: "ClientHasInvoices" as const, invoices: count };
    }

    await client.query(`DELETE FROM clients WHERE id=$1`, [id]);

    await client.query("COMMIT");
    return { deleted: true as const };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}