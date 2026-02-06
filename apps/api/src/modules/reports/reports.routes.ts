import { Router } from "express";
import * as controller from "./reports.controller";
import { requireAuth, requireRole } from "../../middleware/auth";

const router = Router();

router.get("/sales", requireAuth, requireRole("admin"), controller.salesReport);
router.get("/vat", requireAuth, requireRole("admin"), controller.vatReport);
router.get("/outstanding", requireAuth, requireRole("admin"), controller.outstandingReport);

export default router;
