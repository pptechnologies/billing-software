import { z } from "zod";

export const createEmployeeSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  department_id: z.string().uuid("Invalid department ID").optional(),
  designation: z.string().optional(),
  employment_type: z.enum(["full_time", "part_time", "contract", "intern"]).default("full_time"),
  status: z.enum(["active", "inactive", "terminated"]).default("active"),
  join_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD").optional(),
  basic_salary: z.coerce.number().min(0).default(0),
});

export const updateEmployeeSchema = createEmployeeSchema.partial();

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
