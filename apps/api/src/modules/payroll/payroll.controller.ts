import type { Request, Response, NextFunction } from "express";
import { createPayrollSchema, updatePayrollSchema, payrollQuerySchema } from "./payroll.validation";
import * as repo from "./payroll.repo";
import { httpError } from "../../utils/httpError";

export async function createPayroll(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createPayrollSchema.parse(req.body);
    const payroll = await repo.createPayroll(parsed);
    return res.status(201).json(payroll);
  } catch (err) {
    return next(err);
  }
}

export async function listPayroll(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = payrollQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return next(httpError(400, "ValidationError", "Invalid query parameters"));
    }
    const payroll = await repo.listPayroll(parsed.data);
    return res.json(payroll);
  } catch (err) {
    return next(err);
  }
}

export async function getPayroll(req: Request, res: Response, next: NextFunction) {
  try {
    const payroll = await repo.getPayrollById(req.params.id);
    if (!payroll) return next(httpError(404, "PayrollNotFound", "Payroll record not found"));
    return res.json(payroll);
  } catch (err) {
    return next(err);
  }
}

export async function updatePayroll(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = updatePayrollSchema.parse(req.body);
    const updated = await repo.updatePayrollById(req.params.id, parsed);
    if (!updated) return next(httpError(404, "PayrollNotFound", "Payroll record not found"));
    return res.json(updated);
  } catch (err) {
    return next(err);
  }
}

export async function approvePayroll(req: Request, res: Response, next: NextFunction) {
  try {
    const approved = await repo.approvePayroll(req.params.id);
    if (!approved) return next(httpError(400, "PayrollNotDraft", "Payroll must be in draft status to approve"));
    return res.json(approved);
  } catch (err) {
    return next(err);
  }
}

export async function markPayrollPaid(req: Request, res: Response, next: NextFunction) {
  try {
    const paid = await repo.markPayrollPaid(req.params.id);
    if (!paid) return next(httpError(400, "PayrollNotApproved", "Payroll must be approved before marking as paid"));
    return res.json(paid);
  } catch (err) {
    return next(err);
  }
}

export async function getPayrollSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      return next(httpError(400, "ValidationError", "month and year are required"));
    }
    const summary = await repo.getPayrollSummary(Number(month), Number(year));
    return res.json(summary);
  } catch (err) {
    return next(err);
  }
}