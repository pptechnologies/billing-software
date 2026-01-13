import { Router } from "express";
import * as controller from "./client.controller";
import { listInvoicesForClient } from "../invoices/invoices.controller";


const router = Router();

router.post("/", controller.createClient);
router.get("/", controller.listClients);
router.get("/:id", controller.getClient);

router.patch("/:id", controller.updateClient);
router.delete("/:id", controller.deleteClient);

router.get("/:id/invoices", listInvoicesForClient);


export default router;
