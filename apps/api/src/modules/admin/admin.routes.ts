import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { getAllUsers } from "./admin.controller";

const router = Router();

router.get(
  "/users",
  requireAuth,
  requireRole("admin"),
  getAllUsers
);

export default router;
