import express from 'express';
import clientRoutes from "./modules/clients/client.routes";
import helmet from 'helmet';
import cors from 'cors';
import errorHandler from "./middleware/error";
import { pool } from './config/db';
import invoiceRoutes from "./modules/invoices/invoices.route";
import paymentRoutes from "./modules/payments/payments.routes";
import reportsRouter from "./modules/reports/reports.routes";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => { 
  res.json({ ok: true });
});
app.get('/db-health', async (_req, res, next) => {
  try {  
    const result = await pool.query('SELECT 1');
    res.json({ db: 'ok' });
  } catch (err) {
    next(err);
  }
});

app.use("/invoices", invoiceRoutes);
app.use("/clients", clientRoutes);
app.use("/payments", paymentRoutes);
app.use("/reports", reportsRouter);
// Global error handler
app.use(errorHandler);

export default app;
