import { Router } from "express";
import * as controller from "./invoices.controller";
import { getInvoice } from "./invoices.controller";
import { createPayment } from "../payments/payments.controller";

const router = Router();

router.post("/", controller.createInvoice);

router.get("/:id", getInvoice);

router.post("/:id/issue", controller.issueInvoice);

router.post("/:id/payments", createPayment);


export default router;
