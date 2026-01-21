import { pool } from "../../config/db";
import { computeInvoiceTotals, computeLineTotal } from "../../utils/money";
import type { CreateInvoiceInput, PatchInvoiceInput, ReplaceInvoiceItemsInput } from "./invoices.validation";

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

  const next 
  
  = Number(r.rows[0].last_seq);
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

type ListInvoicesQuery = {
  clientId?: string;
  status?: string;
  from?: string;
  to?: string;
  q?: string;
  page?: string;
  limit?: string;
};

export async function listInvoices(query: any) {
  const q = query as ListInvoicesQuery;

  const where: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (q.clientId) {
    where.push(`inv.client_id = $${idx++}`);
    params.push(q.clientId);
  }

  if (q.status) {
    where.push(`inv.status = $${idx++}`);
    params.push(q.status);
  }

  if (q.from) {
    where.push(`inv.issue_date >= $${idx++}::date`);
    params.push(q.from);
  }

  if (q.to) {
    where.push(`inv.issue_date <= $${idx++}::date`);
    params.push(q.to);
  }

  if (q.q && q.q.trim()) {
    where.push(`(inv.invoice_number ILIKE $${idx} OR c.name ILIKE $${idx})`);
    params.push(`%${q.q.trim()}%`);
    idx++;
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const limit = Math.min(Math.max(Number(q.limit ?? 20), 1), 100);
  const page = Math.max(Number(q.page ?? 1), 1);
  const offset = (page - 1) * limit;

  // total count
  const countRes = await pool.query(
    `
    SELECT COUNT(*)::int AS total
    FROM invoices inv
    JOIN clients c ON c.id = inv.client_id
    ${whereSql}
    `,
    params
  );

  // limit/offset placeholders derived from current params length
  const limitParam = params.length + 1;
  const offsetParam = params.length + 2;

  const dataRes = await pool.query(
    `
    SELECT
      inv.id,
      inv.invoice_number,
      inv.client_id,
      c.name AS client_name,
      inv.status,
      inv.issue_date,
      inv.due_date,
      inv.currency,
      inv.subtotal,
      inv.tax_rate,
      inv.tax_total,
      inv.total,
      inv.created_at,
      inv.updated_at,
      COALESCE(p.paid_total, 0) AS amount_paid,
      GREATEST(inv.total - COALESCE(p.paid_total, 0), 0) AS amount_due
    FROM invoices inv
    JOIN clients c ON c.id = inv.client_id
    LEFT JOIN (
      SELECT invoice_id, COALESCE(SUM(amount),0) AS paid_total
      FROM payments
      GROUP BY invoice_id
    ) p ON p.invoice_id = inv.id
    ${whereSql}
    ORDER BY inv.created_at DESC
    LIMIT $${limitParam} OFFSET $${offsetParam}
    `,
    [...params, limit, offset]
  );

  return {
    data: dataRes.rows,
    meta: {
      page,
      limit,
      total: countRes.rows[0]?.total ?? 0,
    },
  };
}

export async function listPaymentsForInvoice(invoiceId: string) {
  const r = await pool.query(
    `
    SELECT *
    FROM payments
    WHERE invoice_id = $1
    ORDER BY paid_at DESC, id DESC
    `,
    [invoiceId]
  );
  return r.rows;
}

export async function getClientForInvoice(invoiceId: string) {
  const r = await pool.query(
    `
    SELECT c.*
    FROM invoices i
    JOIN clients c ON c.id = i.client_id
    WHERE i.id = $1
    `,
    [invoiceId]
  );
  return r.rows[0] ?? null;
}

export async function listPaymentsForInvoiceWithSummary(invoiceId: string) {
  // 1. Load invoice
  const invRes = await pool.query(
    `SELECT id, total, currency, status
     FROM invoices
     WHERE id = $1`,
    [invoiceId]
  );

  if (!invRes.rowCount) return null;
  const invoice = invRes.rows[0];

  // 2. Sum payments
  const sumRes = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS amount_paid
     FROM payments
     WHERE invoice_id = $1`,
    [invoiceId]
  );

  const amount_paid = Number(sumRes.rows[0].amount_paid);
  const total = Number(invoice.total);
  const amount_due = Math.max(total - amount_paid, 0);

  // 3. Load payments
  const payRes = await pool.query(
    `SELECT *
     FROM payments
     WHERE invoice_id = $1
     ORDER BY paid_at DESC, id DESC`,
    [invoiceId]
  );

  return {
    invoice,
    summary: {
      total,
      amount_paid,
      amount_due,
    },
    payments: payRes.rows,
  };
}

export async function getLatestPaymentForInvoice(invoiceId: string) {
  const r = await pool.query(
    `
    SELECT id, receipt_number, paid_at
    FROM payments
    WHERE invoice_id = $1
    ORDER BY paid_at DESC NULLS LAST, id DESC
    LIMIT 1
    `,
    [invoiceId]
  );

  return r.rows[0] ?? null;
}


// helper: fetch invoice status with lock
export async function getInvoiceForUpdate(client: any, invoiceId: string) {
  const r = await client.query(
    `SELECT id, status, tax_rate, total
     FROM invoices
     WHERE id = $1
     FOR UPDATE`,
    [invoiceId]
  );
  return r.rows[0] ?? null;
}

export async function patchInvoice(invoiceId: string, input: PatchInvoiceInput) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const inv = await getInvoiceForUpdate(client, invoiceId);
    if (!inv) throw Object.assign(new Error("Invoice not found"), { status: 404, code: "InvoiceNotFound" });
    if (inv.status !== "draft") {
      throw Object.assign(new Error("Invoice is not draft; edits are not allowed"), {
        status: 409,
        code: "InvoiceNotDraft",
      });
    }

    const entries = Object.entries(input).filter(([, v]) => v !== undefined);
    if (entries.length === 0) {
      const cur = await client.query(`SELECT * FROM invoices WHERE id=$1`, [invoiceId]);
      await client.query("COMMIT");
      return cur.rows[0];
    }

    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;

    for (const [k, v] of entries) {
      // normalize due_date: allow null to clear
      sets.push(`${k} = $${i++}`);
      params.push(v);
    }

    sets.push(`updated_at = now()`);
    params.push(invoiceId);

    const up = await client.query(
      `UPDATE invoices
       SET ${sets.join(", ")}
       WHERE id = $${i}
       RETURNING *`,
      params
    );

    await client.query("COMMIT");
    return up.rows[0];
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function replaceInvoiceItems(invoiceId: string, input: ReplaceInvoiceItemsInput) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const inv = await getInvoiceForUpdate(client, invoiceId);
    if (!inv) throw Object.assign(new Error("Invoice not found"), { status: 404, code: "InvoiceNotFound" });
    if (inv.status !== "draft") {
      throw Object.assign(new Error("Invoice is not draft; edits are not allowed"), {
        status: 409,
        code: "InvoiceNotDraft",
      });
    }

    // delete old items (draft-only enforced)
    await client.query(`DELETE FROM invoice_items WHERE invoice_id=$1`, [invoiceId]);

    // insert new items
    const insertedItems: any[] = [];
    for (let i = 0; i < input.items.length; i++) {
      const it = input.items[i];
      const line_total = computeLineTotal(it.qty, it.unit_price);

      const itemRes = await client.query(
        `INSERT INTO invoice_items (
          invoice_id, product_id, description, qty, unit_price, line_total, sort_order
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        RETURNING *`,
        [
          invoiceId,
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

    // recompute invoice totals
    const taxRate = Number(inv.tax_rate ?? 13.0);
    const itemsForTotals = insertedItems.map((it) => ({
      qty: Number(it.qty),
      unit_price: Number(it.unit_price),
    }));

    const totals = computeInvoiceTotals(itemsForTotals, taxRate);

    const upInv = await client.query(
      `UPDATE invoices
       SET subtotal=$2, tax_rate=$3, tax_total=$4, total=$5, updated_at=now()
       WHERE id=$1
       RETURNING *`,
      [invoiceId, totals.subtotal, totals.tax_rate, totals.tax_total, totals.total]
    );

    await client.query("COMMIT");
    return { invoice: upInv.rows[0], items: insertedItems };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function deleteInvoice(invoiceId: string) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const inv = await getInvoiceForUpdate(client, invoiceId);
    if (!inv) throw Object.assign(new Error("Invoice not found"), { status: 404, code: "InvoiceNotFound" });
    if (inv.status !== "draft") {
      throw Object.assign(new Error("Only draft invoices can be deleted"), {
        status: 409,
        code: "InvoiceNotDraft",
      });
    }

    // invoice_items has ON DELETE CASCADE, so deleting invoice will delete items
    await client.query(`DELETE FROM invoices WHERE id=$1`, [invoiceId]);

    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
