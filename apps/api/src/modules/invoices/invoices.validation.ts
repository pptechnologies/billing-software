import { z } from "zod";

export const createInvoiceSchema = z.object({
client_id: z.uuid(),
  issue_date: z.string().optional(), // YYYY-MM-DD (optional)
  due_date: z.string().optional(),
  currency: z.string().min(1).default("NPR"),
  notes: z.string().optional(),
  tax_rate: z.number().min(0).max(100).optional(), // default to 13 in controller/repo
  items: z.array(
    z.object({
      product_id: z.uuid().optional(),
      description: z.string().min(1),
      qty: z.number().positive().default(1),
      unit_price: z.number().min(0),
      sort_order: z.number().int().optional(),
    })
  ).min(1),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
