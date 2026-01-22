import {z} from "zod";

export const createPaymentSchema = z.object ({
    method:  z.enum(["cash", "bank_transfer", "cheque", "other"]).default("cash"),
    amount: z.number().positive(),
    paid_at: z.string().optional(), // YYYY-MM-DD (optional)
    note: z.string().optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;