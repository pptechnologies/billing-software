import { pool } from "../../config/db";
import { computeInvoiceTotals, computeLineTotal } from "../../utils/money";
import type { CreateInvoiceInput } from "./invoices.validation";

function yearPrefix(d: Date) {
  return d.getFullYear();
}
async function generateInvoiceNumber(client: any, prefix = "PP") {
  const year = new Date().getFullYear();

  const r = await client.query(
    `INSERT INTO invoice_counters(year, last_seq)
     VALUES ($1, 1)
     ON CONFLICT (year)
     DO UPDATE SET last_seq = invoice_counters.last_seq + 1
     RETURNING last_seq`,
    [year]
  );

  const next = Number(r.rows[0].last_seq);
  const seqStr = String(next).padStart(6, "0");
  return `${prefix}-${year}-${seqStr}`;
}

export async function createInvoice(input: CreateInvoiceInput) {
  
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // ensure client exists
    const clientExists = await client.query(
      `SELECT id FROM clients WHERE id=$1`,
      [input.client_id]
    );
    if (!clientExists.rowCount) {
      throw Object.assign(new Error("Client not found"), { status: 404 });
    }

    const taxRate = input.tax_rate ?? 13.0;
    const itemsForTotals = input.items.map((it) => ({
      qty: it.qty,
      unit_price: it.unit_price,
    }));

    const totals = computeInvoiceTotals(itemsForTotals, taxRate);

    const invoice_number = await generateInvoiceNumber(client, "PP");

    const issueDate = input.issue_date ?? null;
    const dueDate = input.due_date ?? null;

    const invRes = await client.query(
      `INSERT INTO invoices (
        invoice_number, client_id, status, issue_date, due_date, currency, notes,
        subtotal, tax_rate, tax_total, total
      )
      VALUES (
        $1, $2, 'draft',
        COALESCE($3::date, CURRENT_DATE),
        $4::date,
        $5, $6,
        $7, $8, $9, $10
      )
      RETURNING *`,
      [
        invoice_number,
        input.client_id,
        issueDate,
        dueDate,
        input.currency ?? "NPR",
        input.notes ?? null,
        totals.subtotal,
        totals.tax_rate,
        totals.tax_total,
        totals.total,
      ]
    );

    const invoice = invRes.rows[0];

    // insert items
    const insertedItems: any[] = [];
    for (let i = 0; i < input.items.length; i++) {
      const it = input.items[i];
      const line_total = computeLineTotal(it.qty, it.unit_price);

      const itemRes = await client.query(
        `INSERT INTO invoice_items (
          invoice_id, product_id, description, qty, unit_price, line_total, sort_order
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          invoice.id,
          it.product_id ?? null,
          it.description,
          it.qty,
          it.unit_price,
          line_total,
          it.sort_order ?? i,
        ]
      );

      insertedItems.push(itemRes.rows[0]);
    }

    await client.query("COMMIT");

    return { invoice, items: insertedItems };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
  
}
export async function listInvoicesByClientId(clientId: string) {
  const r = await pool.query(
    `SELECT
      id,
      invoice_number,
      client_id,
      status,
      issue_date,
      due_date,
      currency,
      notes,
      subtotal,
      tax_rate,
      tax_total,
      total,
      created_at,
      updated_at
     FROM invoices
     WHERE client_id = $1
     ORDER BY created_at DESC`,
    [clientId]
  );

  return r.rows;
}

export async function getInvoiceById(invoiceId: string) {
  const inv = await pool.query(
    `SELECT *
     FROM invoices
     WHERE id = $1`,
    [invoiceId]
  );

  if (!inv.rowCount) return null;

  const items = await pool.query(
    `SELECT *
     FROM invoice_items
     WHERE invoice_id = $1
     ORDER BY sort_order ASC`,
    [invoiceId]
  );

  return {
    invoice: inv.rows[0],
    items: items.rows,
  };
}

export async function issueInvoice(invoiceId: string) {
  const r = await pool.query(
    `UPDATE invoices
     SET status = 'issued',
         issue_date = COALESCE(issue_date, CURRENT_DATE),
         updated_at = now()
     WHERE id = $1 AND status = 'draft'
     RETURNING *`,
    [invoiceId] 
  );
 return r.rows[0] ?? null; 
}
