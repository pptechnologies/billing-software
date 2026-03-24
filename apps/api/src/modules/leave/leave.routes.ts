import { Router } from "express";
import * as controller from "./leave.controller";
import { requireAuth, requireRole } from "../../middleware/auth";

const router = Router();

router.get("/", requireAuth, controller.listLeaveRequests);
router.post("/", requireAuth, controller.createLeaveRequest);

// Specific routes MUST come before /:id
router.patch("/:id/approve", requireAuth, requireRole("admin"), controller.approveLeaveRequest);
router.patch("/:id/reject", requireAuth, requireRole("admin"), controller.rejectLeaveRequest);
router.patch("/:id/cancel", requireAuth, controller.cancelLeaveRequest);

// Generic routes AFTER specific ones
router.get("/:id", requireAuth, controller.getLeaveRequest);
router.patch("/:id", requireAuth, controller.updateLeaveRequest);

export default router;