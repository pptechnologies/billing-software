import type { Request, Response, NextFunction } from "express";
import * as repo from "./reports.repo";
import { rangeQuerySchema, asOfQuerySchema } from "./reports.validation";

export async function salesReport(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = rangeQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "ValidationError", details: parsed.error.flatten() });
    }

    const { from, to } = parsed.data;
    const result = await repo.salesReport(from, to);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function vatReport(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = rangeQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "ValidationError", details: parsed.error.flatten() });
    }

    const { from, to } = parsed.data;
    const result = await repo.vatReport(from, to);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function outstandingReport(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = asOfQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "ValidationError", details: parsed.error.flatten() });
    }

    const { asOf } = parsed.data;
    const result = await repo.outstandingReport(asOf ?? null);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

