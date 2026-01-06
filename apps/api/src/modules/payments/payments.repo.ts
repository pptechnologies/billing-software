// src/modules/payments/payments.repo.ts
import { pool } from "../../config/db";
import type { CreatePaymentInput } from "./payments.validation";

export async function createPaymentForInvoice(
  invoiceId: string,
  input: CreatePaymentInput
) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Lock invoice row so concurrent payments don't race
    const invRes = await client.query(
      `SELECT id, status, total
       FROM invoices
       WHERE id = $1
       FOR UPDATE`,
      [invoiceId]
    );

    if (!invRes.rowCount) {
      throw Object.assign(new Error("Invoice not found"), {
        status: 404,
        code: "InvoiceNotFound",
      });
    }

    const invoice = invRes.rows[0] as { id: string; status: string; total: string };

    // Only allow payments for issued invoices
    if (invoice.status !== "issued") {
      throw Object.assign(new Error("Invoice must be issued before payment"), {
        status: 409,
        code: "InvoiceNotIssued",
      });
    }

    // Validate incoming amount
    const incomingAmount = Number(input.amount);
    if (!Number.isFinite(incomingAmount) || incomingAmount <= 0) {
      throw Object.assign(new Error("Invalid payment amount"), {
        status: 400,
        code: "InvalidAmount",
      });
    }

    // Calculate paid_total before inserting this payment
    const sumRes = await client.query(
      `SELECT COALESCE(SUM(amount), 0) AS paid_total
       FROM payments
       WHERE invoice_id = $1`,
      [invoiceId]
    );

    const paid_total_before = Number(sumRes.rows[0].paid_total);
    const invoice_total = Number(invoice.total);

    const balance_before = +(invoice_total - paid_total_before).toFixed(2);

    // If already fully paid (shouldn't happen if status is issued, but safe)
    if (balance_before <= 0) {
      throw Object.assign(new Error("Invoice already paid"), {
        status: 409,
        code: "InvoiceAlreadyPaid",
      });
    }

    // Block overpayment
    if (incomingAmount > balance_before) {
      throw Object.assign(new Error("Payment exceeds balance due"), {
        status: 400,
        code: "OverPayment",
        meta: { balance_before, incomingAmount },
      });
    }

    // Insert payment
    const paidAt = input.paid_at ?? null;
    const method = input.method ?? "cash";
    const note = input.note ?? null;
    const receipt_number = await generateReceiptNumber(client, "RCT");


  const payRes = await client.query(
  `INSERT INTO payments (invoice_id, method, amount, paid_at, note, receipt_number)
   VALUES ($1, $2, $3, COALESCE($4::timestamptz, now()), $5, $6)
   RETURNING *`,
  [invoiceId, method, incomingAmount, paidAt, note, receipt_number]
);


    const payment = payRes.rows[0];

    // Compute totals after insert 
    const paid_total = +(paid_total_before + incomingAmount).toFixed(2);
    const balance_due = +(invoice_total - paid_total).toFixed(2);

    // If fully paid, mark invoice paid
    let updatedInvoice: any;

    if (balance_due === 0) {
      const up = await client.query(
        `UPDATE invoices
         SET status = 'paid',
             updated_at = now()
         WHERE id = $1
         RETURNING *`,
        [invoiceId]
      );
      updatedInvoice = up.rows[0];
    } else {
      const cur = await client.query(`SELECT * FROM invoices WHERE id=$1`, [invoiceId]);
      updatedInvoice = cur.rows[0];
    }

    await client.query("COMMIT");

    return { payment, invoice: updatedInvoice, paid_total, balance_due };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

async function generateReceiptNumber(client: any, prefix = "RCT") {
  const year = new Date().getFullYear();

  const r = await client.query(
    `INSERT INTO receipt_counters(year, last_seq)
     VALUES ($1, 1)
     ON CONFLICT (year)
     DO UPDATE SET last_seq = receipt_counters.last_seq + 1
     RETURNING last_seq`,
    [year]
  );

  const next = Number(r.rows[0].last_seq);
  const seqStr = String(next).padStart(6, "0");
  return `${prefix}-${year}-${seqStr}`;
}
