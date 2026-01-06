import type { Request, Response, NextFunction } from "express";
import { createInvoiceSchema } from "./invoices.validation";
import puppeteer from "puppeteer";
import * as repo from "./invoices.repo";
import { company } from "../../config/company";


export async function createInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createInvoiceSchema.parse(req.body);

    const result = await repo.createInvoice(parsed);

    res.status(201).json({
      invoice: result.invoice,
      items: result.items,
    });
  } catch (err: any) {
    // Zod validation error
    if (err?.name === "ZodError") {
      return res.status(400).json({
        error: "ValidationError",
        details: err.errors,
      });
    }
    next(err);
  }
}

export async function listInvoicesForClient(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = req.params.id;

    const invoices = await repo.listInvoicesByClientId(clientId);
    res.json(invoices);
  } catch (err) {
    next(err);
  }
}


export async function getInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const invoiceId = req.params.id;

    const result = await repo.getInvoiceById(invoiceId);
    if (!result) {
      return res.status(404).json({ error: "InvoiceNotFound" });
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function issueInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const invoiceId = req.params.id;

    const updated = await repo.issueInvoice(invoiceId);

    if (!updated) {
      const exists = await repo.getInvoiceById(invoiceId);
      if (!exists) return res.status(404).json({ error: "invoiceNotFound" });
      
      return res.status(409).json ({
        error: "InvoiceNotDraft",
        message: "Only draft invoices can be issued.",
      });
    } 

    res.json({ invoice: updated});
    } catch (err) {
      next(err);
    }
}

export async function listInvoices(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await repo.listInvoices(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function listInvoicePayments(req: Request, res: Response, next: NextFunction) {
  try {
    const invoiceId = req.params.id;
    const payments = await repo.listPaymentsForInvoice(invoiceId);
    res.json({ invoice_id: invoiceId, payments });
  } catch (err) {
    next(err);
  }
}


function money(n: any) {
  const x = Number(n ?? 0);
  return x.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function invoiceHtml(data: any) {
  const { invoice, items, client } = data;

  const seller = company;


  const issued = invoice.issue_date ? new Date(invoice.issue_date).toISOString().slice(0, 10) : "";
  const due = invoice.due_date ? new Date(invoice.due_date).toISOString().slice(0, 10) : "";

  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${invoice.invoice_number}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #111; margin: 32px; }
    .row { display: flex; justify-content: space-between; gap: 24px; }
    .muted { color: #555; }
    h1 { font-size: 18px; margin: 0 0 8px; }
    h2 { font-size: 12px; margin: 16px 0 6px; text-transform: uppercase; letter-spacing: .5px; }
    .box { border: 1px solid #ddd; padding: 12px; border-radius: 8px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { border-bottom: 1px solid #eee; padding: 8px; vertical-align: top; }
    th { text-align: left; background: #fafafa; border-top: 1px solid #eee; }
    .right { text-align: right; }
    .totals { width: 320px; margin-left: auto; margin-top: 12px; }
    .totals td { border: none; padding: 6px 8px; }
    .totals tr:last-child td { font-weight: 700; border-top: 1px solid #ddd; padding-top: 10px; }
    .footer { margin-top: 18px; font-size: 11px; color: #666; }
  </style>
</head>
<body>
  <div class="row">
  <!-- LEFT COLUMN -->
  <div>
    <h1>TAX INVOICE</h1>
    <div class="muted">
      ${seller.name}<br/>
      ${seller.address}<br/>
      ${seller.vatPan}<br/>
      ${seller.phone ? `Phone: ${seller.phone}<br/>` : ""}
      ${seller.email ? `Email: ${seller.email}` : ""}
    </div>
  </div>

  <!-- RIGHT COLUMN -->
  <div class="box" style="min-width: 280px;">
    <div><b>Invoice No:</b> ${invoice.invoice_number}</div>
    <div><b>Issue Date:</b> ${issued}</div>
    <div><b>Due Date:</b> ${due || "-"}</div>
    <div><b>Status:</b> ${String(invoice.status).toUpperCase()}</div>
    <div><b>Currency:</b> ${invoice.currency || "NPR"}</div>
  </div>
</div>

  <h2>Bill To</h2>
  <div class="box">
    <div><b>${client?.name ?? "Client"}</b></div>
    <div class="muted">
      ${client?.address_line1 ?? ""} ${client?.address_line2 ?? ""}<br/>
      ${client?.city ?? ""} ${client?.country ?? ""}<br/>
      ${client?.phone ? `Phone: ${client.phone}<br/>` : ""}
      ${client?.email ? `Email: ${client.email}` : ""}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 46px;">#</th>
        <th>Description</th>
        <th style="width: 90px;" class="right">Qty</th>
        <th style="width: 120px;" class="right">Rate</th>
        <th style="width: 120px;" class="right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${
        items
          .map(
            (it: any, idx: number) => `
            <tr>
              <td>${idx + 1}</td>
              <td>${it.description ?? ""}</td>
              <td class="right">${money(it.qty)}</td>
              <td class="right">${money(it.unit_price)}</td>
              <td class="right">${money(it.line_total)}</td>
            </tr>
          `
          )
          .join("")
      }
    </tbody>
  </table>

  <table class="totals">
    <tr><td class="right muted">Subtotal</td><td class="right">${money(invoice.subtotal)}</td></tr>
    <tr><td class="right muted">VAT (${money(invoice.tax_rate)}%)</td><td class="right">${money(invoice.tax_total)}</td></tr>
    <tr><td class="right muted">Grand Total</td><td class="right">${money(invoice.total)}</td></tr>
  </table>

  ${
    invoice.notes
      ? `<h2>Notes</h2><div class="box">${String(invoice.notes)}</div>`
      : ""
  }

  <div class="footer">
    This is a system-generated invoice.
  </div>
</body>
</html>`;
}

export async function getInvoicePdf(req: any, res: any, next: any) {
  try {
    const invoiceId = req.params.id;

    // Get invoice + items
    const data = await repo.getInvoiceById(invoiceId);
    if (!data) return res.status(404).json({ error: "InvoiceNotFound" });

    // Also load client details 
    const clientRes = await repo.getClientForInvoice(invoiceId);
    const payload = { ...data, client: clientRes };

    const html = invoiceHtml(payload);

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"], // helps in deploy envs
    });                        

    try {
     const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 800 });
await page.setContent(html, { waitUntil: "networkidle0" });

const pdf = await page.pdf({
  format: "A4",
  landscape: true,
  printBackground: true,
  margin: { top: "12mm", bottom: "12mm", left: "12mm", right: "12mm" },
});


      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${payload.invoice.invoice_number}.pdf"`);
      return res.send(pdf);
    } finally {
      await browser.close();
    }
  } catch (err) {
    next(err);
  }
}
export async function getInvoiceReceiptPdf(req: Request, res: Response, next: NextFunction) {
  try {
    const invoiceId = req.params.id;

    // optional: ensure invoice exists (nicer error)
    const inv = await repo.getInvoiceById(invoiceId);
    if (!inv) return res.status(404).json({ error: "InvoiceNotFound" });

    const payment = await repo.getLatestPaymentForInvoice(invoiceId);
    if (!payment) {
      return res.status(404).json({ error: "NoPaymentsForInvoice" });
    }

    // Redirect to the canonical receipt route
    return res.redirect(302, `/payments/${payment.id}/receipt/pdf`);
  } catch (err) {
    next(err);
  }
}

