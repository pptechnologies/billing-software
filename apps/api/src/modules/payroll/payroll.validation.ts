import { z } from "zod";

export const createPayrollSchema = z.object({
  employee_id: z.string().uuid("Invalid employee ID"),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000),
  basic_salary: z.coerce.number().min(0),
  allowances: z.coerce.number().min(0).default(0),
  deductions: z.coerce.number().min(0).default(0),
  note: z.string().optional(),
});

export const updatePayrollSchema = createPayrollSchema.partial().omit({ employee_id: true, month: true, year: true });

export const payrollQuerySchema = z.object({
  employee_id: z.string().uuid().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).optional(),
  status: z.enum(["draft", "approved", "paid"]).optional(),
});

export type CreatePayrollInput = z.infer<typeof createPayrollSchema>;
export type UpdatePayrollInput = z.infer<typeof updatePayrollSchema>;