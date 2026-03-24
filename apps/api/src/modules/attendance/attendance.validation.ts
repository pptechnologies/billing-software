import { z } from "zod";

export const markAttendanceSchema = z.object({
  employee_id: z.string().uuid("Invalid employee ID"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  status: z.enum(["present", "absent", "half_day", "holiday", "leave"]).default("present"),
  check_in: z.string().optional(),   // e.g. "09:00"
  check_out: z.string().optional(),  // e.g. "18:00"
  note: z.string().optional(),
});

export const updateAttendanceSchema = markAttendanceSchema.partial().omit({ employee_id: true, date: true });

export const attendanceQuerySchema = z.object({
  employee_id: z.string().uuid().optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>;