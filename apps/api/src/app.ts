import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import cors from "cors";

import errorHandler from "./middleware/error";
import { requireAuth, requireRole } from "./middleware/auth";

// Billing routes
import authRoutes from "./modules/auth/auth.routes";
import clientRoutes from "./modules/clients/client.routes";
import invoiceRoutes from "./modules/invoices/invoices.route";
import paymentRoutes from "./modules/payments/payments.routes";
import adminRoutes from "./modules/admin/admin.routes";
import reportsRouter from "./modules/reports/reports.routes";

// HRMS routes
import employeeRoutes from "./modules/employees/employee.routes";
import attendanceRoutes from "./modules/attendance/attendance.routes";
import payrollRoutes from "./modules/payroll/payroll.routes";
import leaveRoutes from "./modules/leave/leave.routes";

import { pool } from "./config/db";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Health checks
app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/db-health", async (_req, res, next) => {
  try {
    await pool.query("SELECT 1");
    res.json({ db: "ok" });
  } catch (err) {
    next(err);
  }
});

// AUTH routes (public)
app.use("/auth", authRoutes);

// Billing routes (protected)
app.use("/clients", requireAuth, clientRoutes);
app.use("/invoices", requireAuth, invoiceRoutes);
app.use("/payments", requireAuth, paymentRoutes);
app.use("/admin", requireAuth, requireRole("admin"), adminRoutes);
app.use("/reports", requireAuth, requireRole("admin", "finance"), reportsRouter);

// HRMS routes (protected)
app.use("/employees", requireAuth, employeeRoutes);
app.use("/attendance", requireAuth, attendanceRoutes);
app.use("/payroll", requireAuth, requireRole("admin"), payrollRoutes);
app.use("/leave", requireAuth, leaveRoutes);

// Auth test
app.get("/auth-test", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// Global error handler
app.use(errorHandler);

export default app;




















