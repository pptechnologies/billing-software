import { Router } from "express";
import * as controller from "./payroll.controller";
import { requireAuth, requireRole } from "../../middleware/auth";

const router = Router();

router.get("/", requireAuth, controller.listPayroll);
router.get("/summary", requireAuth, requireRole("admin"), controller.getPayrollSummary);
router.get("/:id", requireAuth, controller.getPayroll);
router.post("/", requireAuth, requireRole("admin"), controller.createPayroll);
router.patch("/:id", requireAuth, requireRole("admin"), controller.updatePayroll);
router.patch("/:id/approve", requireAuth, requireRole("admin"), controller.approvePayroll);
router.patch("/:id/pay", requireAuth, requireRole("admin"), controller.markPayrollPaid);

export default router;