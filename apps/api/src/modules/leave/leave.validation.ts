import { z } from "zod";

export const createLeaveSchema = z.object({
  employee_id: z.string().uuid("Invalid employee ID"),
  type: z.enum(["annual", "sick", "maternity", "paternity", "unpaid", "other"]).default("annual"),
  from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  reason: z.string().optional(),
});

export const updateLeaveSchema = createLeaveSchema.partial().omit({ employee_id: true });

export const leaveQuerySchema = z.object({
  employee_id: z.string().uuid().optional(),
  status: z.enum(["pending", "approved", "rejected", "cancelled"]).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type CreateLeaveInput = z.infer<typeof createLeaveSchema>;
export type UpdateLeaveInput = z.infer<typeof updateLeaveSchema>;