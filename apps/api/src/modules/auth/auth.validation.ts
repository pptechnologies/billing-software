import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email().max(255),
  password: z
    .string()
    .min(10, "Password must be at least 10 characters")
    .max(200)
    .regex(/[A-Z]/, "Add at least 1 uppercase letter")
    .regex(/[a-z]/, "Add at least 1 lowercase letter")
    .regex(/[0-9]/, "Add at least 1 number"),
  name: z.string().min(2).max(120).optional(),
});

export const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1),
});

