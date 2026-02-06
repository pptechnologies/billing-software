import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import cors from "cors";

import errorHandler from "./middleware/error";
import { requireAuth, requireRole } from "./middleware/auth";

import authRoutes from "./modules/auth/auth.routes";
import clientRoutes from "./modules/clients/client.routes";
import invoiceRoutes from "./modules/invoices/invoices.route";
import paymentRoutes from "./modules/payments/payments.routes";
import reportsRouter from "./modules/reports/reports.routes";

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

// health
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

// Protected business routes
app.use("/clients", requireAuth, clientRoutes);
app.use("/invoices", requireAuth, invoiceRoutes);
app.use("/payments", requireAuth, paymentRoutes);
app.use("/reports", reportsRouter);

// Reports: locked down by role
app.use("/reports", requireAuth, requireRole("admin", "finance"), reportsRouter);


app.get("/auth-test", requireAuth, (req, res) => {
  res.json({ user: req.user });
});


// Global error handler
app.use(errorHandler);

export default app;
