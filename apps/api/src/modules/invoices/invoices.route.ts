import { Router } from "express";
import * as controller from "./invoices.controller";
import { createPayment } from "../payments/payments.controller";

const router = Router();

router.post("/", controller.createInvoice);
router.get("/:id", controller.getInvoice);
router.post("/:id/issue", controller.issueInvoice);
router.post("/:id/payments", createPayment);
router.get("/", controller.listInvoices);               
router.get("/:id/payments", controller.listInvoicePayments);
router.get("/:id/pdf", controller.getInvoicePdf);
router.get("/:id/receipt/pdf", controller.getInvoiceReceiptPdf);
router.patch("/:id", controller.patchInvoice);
router.put("/:id/items", controller.replaceInvoiceItems);
router.delete("/:id", controller.deleteInvoice);




export default router;
