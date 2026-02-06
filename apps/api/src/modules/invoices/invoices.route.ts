import { Router } from "express";
import * as controller from "./invoices.controller";
import { createPayment } from "../payments/payments.controller";
import { requireAuth, requireRole } from "../../middleware/auth";

const router = Router();

// invoices list/create
router.get("/", requireAuth, controller.listInvoices);
router.post("/", requireAuth, controller.createInvoice);

// invoice actions
router.get("/:id", requireAuth, controller.getInvoice);
router.post("/:id/issue", requireAuth, controller.issueInvoice);

// payments for an invoice
router.get("/:id/payments", requireAuth, controller.listInvoicePayments);
router.post("/:id/payments", requireAuth, createPayment);

// pdfs 
router.get("/:id/pdf", requireAuth, controller.getInvoicePdf);
router.get("/:id/receipt/pdf", requireAuth, controller.getInvoiceReceiptPdf);

// edits
router.patch("/:id", requireAuth, controller.patchInvoice);
router.put("/:id/items", requireAuth, controller.replaceInvoiceItems);

// role required: admin
router.delete("/:id", requireAuth, requireRole("admin"), controller.deleteInvoice);

export default router;
