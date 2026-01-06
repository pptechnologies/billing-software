import type { Request, Response, NextFunction } from "express";
import puppeteer from "puppeteer";
import { createPaymentSchema } from "./payments.validation";
import * as repo from "./payments.repo";
import { pool } from "../../config/db";
import { company } from "../../config/company";


export async function createPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const invoiceId = req.params.id;
    const parsed = createPaymentSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: "ValidationError", details: parsed.error.flatten() });
    }

    const result = await repo.createPaymentForInvoice(invoiceId, parsed.data);
    res.status(201).json(result);
  } catch (err: any) {
    const status = err?.status ?? 500;
    res.status(status).json({ error: err?.message ?? "InternalError" });
  }
}

function money(n: any) {
  return Number(n ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function receiptHtml(data: any) {
  const { payment, invoice, client } = data;

 const seller = company;

  const paidAt = new Date(payment.paid_at).toISOString().slice(0, 10);

  return `
<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Receipt ${payment.id}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; margin: 32px; color: #111; }
  h1 { font-size: 18px; margin-bottom: 6px; }
  .muted { color: #555; }
  .box { border: 1px solid #ddd; padding: 12px; border-radius: 8px; margin-bottom: 12px; }
.row { display: block; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  td { padding: 6px 0; }
  .right { text-align: right; }
</style>
</head>
<body>

<h1>PAYMENT RECEIPT</h1>
<div class="muted">${seller.name}<br/>${seller.address}<br/>${seller.vatPan}</div>

<div class="row" style="margin-top: 16px;">
  <div class="box">
    <b>Received From</b><br/>
    ${client.name}<br/>
    ${client.address_line1 ?? ""}<br/>
    ${client.city ?? ""}
  </div>

  <div class="box">
    <div><b>Receipt No:</b> ${payment.receipt_number ?? payment.id}</div>
    <div><b>Date:</b> ${paidAt}</div>
    <div><b>Method:</b> ${payment.method.toUpperCase()}</div>
    <div><b>Invoice:</b> ${invoice.invoice_number}</div>
  </div>
</div>

<table>
  <tr>
    <td>Amount Received</td>
    <td class="right"><b>${money(payment.amount)} ${invoice.currency}</b></td>
  </tr>
</table>

<p class="muted" style="margin-top: 24px;">
  This is a system-generated receipt.
</p>

</body>
</html>`;
}

export async function getPaymentReceiptPdf(req: any, res: any, next: any) {
  try {
    const paymentId = req.params.id;

    // Load payment + invoice + client
    const r = await pool.query(
      `
      SELECT
        p.*,
        i.invoice_number,
        i.currency,
        c.*
      FROM payments p
      JOIN invoices i ON i.id = p.invoice_id
      JOIN clients c ON c.id = i.client_id
      WHERE p.id = $1
      `,
      [paymentId]
    );

    if (!r.rowCount) {
      return res.status(404).json({ error: "PaymentNotFound" });
    }

    const row = r.rows[0];

    const html = receiptHtml({
      payment: row,
      invoice: row,
      client: row,
    });

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const page = await browser.newPage();
await page.setViewport({ width: 800, height: 1100 });
await page.setContent(html, { waitUntil: "networkidle0" });

const pdf = await page.pdf({
  format: "A4",
  printBackground: true, 
  margin: { top: "12mm", bottom: "12mm", left: "12mm", right: "12mm" },
});


const fileName = row.receipt_number ?? `receipt-${paymentId}`;

res.setHeader("Content-Type", "application/pdf");
res.setHeader(
  "Content-Disposition",
  `inline; filename="${fileName}.pdf"`
);
res.send(pdf);

    } finally {
      await browser.close();
    }
  } catch (err) {
    next(err);
  }
}