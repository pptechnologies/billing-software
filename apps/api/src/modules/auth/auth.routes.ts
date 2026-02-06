import { Router } from "express";
import * as controller from "./auth.controller";
import { authLimiter } from "./auth.controller";
import { requireAuth } from "../../middleware/auth";

const router = Router();

// public
router.post("/signup", authLimiter, controller.signup);
router.post("/login", authLimiter, controller.login);
router.post("/refresh", controller.refresh);
router.post("/logout", controller.logout);
router.get("/me", requireAuth, controller.me);

export default router;
