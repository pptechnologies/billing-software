import { Router } from "express";
import * as controller from "./client.controller";
import { listInvoicesForClient } from "../invoices/invoices.controller";
import { requireAuth, requireRole } from "../../middleware/auth";

const router = Router();

router.get("/", requireAuth, controller.listClients);
router.post("/", requireAuth, controller.createClient);

router.get("/:id", requireAuth, controller.getClient);
router.get("/:id/invoices", requireAuth, listInvoicesForClient);

router.patch("/:id", requireAuth, controller.updateClient);

// role required: admin
router.delete("/:id", requireAuth, requireRole("admin"), controller.deleteClient);

export default router;
