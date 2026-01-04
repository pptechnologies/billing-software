import dotenv from "dotenv";
dotenv.config();

import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

export const pool = connectionString
  ? new Pool({ connectionString })
  : new Pool({
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT || 5432),
      database: process.env.DB_NAME || "billing_db",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD,
      ssl: false,
    });
