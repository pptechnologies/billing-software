import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
  getAllUsers,
  changeUserRole,
} from "./admin.controller";

const router = Router();

router.get(
  "/users",
  requireAuth,
  requireRole("admin"),
  getAllUsers
);

router.patch(
  "/users/:id/role",
  requireAuth,
  requireRole("admin"),
  changeUserRole
);

export default router;
