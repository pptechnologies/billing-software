import { z } from "zod";

export const createClientSchema = z.object({
  name: z.string().min(1, "name is required"),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
