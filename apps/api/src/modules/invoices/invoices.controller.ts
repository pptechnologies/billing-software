import type { Request, Response, NextFunction } from "express";
import { createInvoiceSchema } from "./invoices.validation";
import * as repo from "./invoices.repo";

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