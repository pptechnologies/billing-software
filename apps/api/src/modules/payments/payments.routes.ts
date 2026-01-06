import { Router } from "express";
import * as controller from "./payments.controller";

const router = Router();

router.get("/:id/receipt/pdf", controller.getPaymentReceiptPdf);


export default router;
