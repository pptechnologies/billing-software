import { Router } from "express";
import * as controller from "./attendance.controller";
import { requireAuth, requireRole } from "../../middleware/auth";

const router = Router();

router.get("/", requireAuth, controller.listAttendance);
router.get("/summary", requireAuth, controller.getAttendanceSummary);
router.get("/:id", requireAuth, controller.getAttendance);
router.post("/", requireAuth, requireRole("admin"), controller.markAttendance);
router.patch("/:id", requireAuth, requireRole("admin"), controller.updateAttendance);

export default router;
