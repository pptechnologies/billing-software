import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import * as controller from "./admin.controller";

const router = Router();

router.get( "/users", requireAuth, requireRole("admin"), controller.getAllUsers);

router.patch( "/users/:id/role", requireAuth, requireRole("admin"), controller.changeUserRole);

router.patch("/users/:id/status", requireAuth, requireRole("admin"), controller.changeUserStatus);

export default router;
