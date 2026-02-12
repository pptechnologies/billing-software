import { z } from "zod";

export const changeRoleSchema = z.object({
  role: z.enum(["admin", "user"]),
});

export const changeStatusSchema = z.object({
  is_active: z.boolean(),
});
