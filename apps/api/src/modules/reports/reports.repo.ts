import { pool } from "../../config/db";

function normalizeRange(from?: string, to?: string) {
  const now = new Date();
  const defaultTo = now.toISOString().slice(0, 10);
  const d = new Date(now);
  d.setDate(d.getDate() - 30);
  const defaultFrom = d.toISOString().slice(0, 10);

  return { from: from ?? defaultFrom, to: to ?? defaultTo };
}

export async function salesReport(from?: string, to?: string) {
  const r = normalizeRange(from, to);

  // invoices issued/paid in range (by issue_date)
  const invoicedRes = await pool.query(
    `
    SELECT
      COALESCE(SUM(total), 0) AS total_invoiced,
      COALESCE(SUM(subtotal), 0) AS subtotal_invoiced,
      COALESCE(SUM(tax_total), 0) AS vat_invoiced
    FROM invoices
    WHERE status IN ('issued', 'paid')
      AND issue_date >= $1::date
      AND issue_date <= $2::date
    `,
    [r.from, r.to]
  );

  // cash received in range (by paid_at date)
  const cashRes = await pool.query(
    `
    SELECT COALESCE(SUM(amount), 0) AS cash_received
    FROM payments
    WHERE paid_at::date >= $1::date
      AND paid_at::date <= $2::date
    `,
    [r.from, r.to]
  );

  const totalInvoiced = Number(invoicedRes.rows[0].total_invoiced);
  const cashReceived = Number(cashRes.rows[0].cash_received);

  return {
    from: r.from,
    to: r.to,
    invoices: {
      subtotal: Number(invoicedRes.rows[0].subtotal_invoiced),
      vat: Number(invoicedRes.rows[0].vat_invoiced),
      total: totalInvoiced,
    },
    cash: {
      received: cashReceived,
    },
  };
}

export async function vatReport(from?: string, to?: string) {
  const r = normalizeRange(from, to);

  const vatRes = await pool.query(
    `
    SELECT
      COALESCE(SUM(subtotal), 0) AS vatable_sales,
      COALESCE(SUM(tax_total), 0) AS vat_invoiced
    FROM invoices
    WHERE status IN ('issued', 'paid')
      AND issue_date >= $1::date
      AND issue_date <= $2::date
    `,
    [r.from, r.to]
  );

  return {
    from: r.from,
    to: r.to,
    vatableSales: Number(vatRes.rows[0].vatable_sales),
    vatInvoiced: Number(vatRes.rows[0].vat_invoiced),
  };
}

export async function outstandingReport(asOf?: string | null) {
  const asOfDate = asOf ?? new Date().toISOString().slice(0, 10);

  const r = await pool.query(
    `
    WITH paid AS (
      SELECT invoice_id, COALESCE(SUM(amount), 0) AS amount_paid
      FROM payments
      GROUP BY invoice_id
    )
    SELECT
      inv.id,
      inv.invoice_number,
      inv.client_id,
      c.name AS client_name,
      inv.issue_date,
      inv.due_date,
      inv.total,
      COALESCE(p.amount_paid, 0) AS amount_paid,
      GREATEST(inv.total - COALESCE(p.amount_paid, 0), 0) AS amount_due
    FROM invoices inv
    JOIN clients c ON c.id = inv.client_id
    LEFT JOIN paid p ON p.invoice_id = inv.id
    WHERE inv.status IN ('issued')
      AND inv.issue_date <= $1::date
      AND (inv.total - COALESCE(p.amount_paid, 0)) > 0
    ORDER BY inv.due_date NULLS LAST, inv.issue_date DESC
    `,
    [asOfDate]
  );

  const totalDue = r.rows.reduce((s, row) => s + Number(row.amount_due), 0);

  return {
    asOf: asOfDate,
    count: r.rows.length,
    totalDue: +totalDue.toFixed(2),
    invoices: r.rows,
  };
}

