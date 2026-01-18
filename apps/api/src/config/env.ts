import dotenv from 'dotenv';

dotenv.config();

export const PORT = Number(process.env.PORT) || 4000;

export const COMPANY_NAME = process.env.COMPANY_NAME || "DefaultCompany";
