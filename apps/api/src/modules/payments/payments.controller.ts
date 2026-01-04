import type { Request, Response, NextFunction } from "express";
import { createPaymentSchema } from "./payments.validation";
import * as repo from "./payments.repo";

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

export async function listPayments(req: Request, res:Response, next: NextFunction) {
  try{
    const payments = await repo.listPayments();
    res.json(payments); 
  } catch (err) {
    next(err);
  }
}