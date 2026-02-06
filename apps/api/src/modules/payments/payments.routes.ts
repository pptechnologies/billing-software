import { Router } from "express";
import * as controller from "./payments.controller";
import { requireAuth } from "../../middleware/auth";

const router = Router();

router.get("/:id/receipt/pdf", requireAuth, controller.getPaymentReceiptPdf);

export default router;
