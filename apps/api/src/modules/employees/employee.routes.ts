import { Router } from "express";
import * as controller from "./employee.controller";
import { requireAuth, requireRole } from "../../middleware/auth";

const router = Router();

// Departments
router.get("/departments", requireAuth, controller.listDepartments);
router.post("/departments", requireAuth, requireRole("admin"), controller.createDepartment);

// Employees
router.get("/", requireAuth, controller.listEmployees);
router.post("/", requireAuth, requireRole("admin"), controller.createEmployee);
router.get("/:id", requireAuth, controller.getEmployee);
router.patch("/:id", requireAuth, requireRole("admin"), controller.updateEmployee);
router.delete("/:id", requireAuth, requireRole("admin"), controller.deleteEmployee);

export default router;