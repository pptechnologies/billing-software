import jwt from "jsonwebtoken";
import crypto from "crypto";
import { authConfig } from "../../config/auth";

const JWT_SECRET = process.env.JWT_SECRET!;
const REFRESH_SECRET = process.env.REFRESH_SECRET!;

export function signAccessToken(payload: { sub: string; email: string; role: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: authConfig.accessTokenTtlSec });
}

export function signRefreshToken(payload: { sub: string }) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: `${authConfig.refreshTokenTtlDays}d` });
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, REFRESH_SECRET) as { sub: string; iat: number; exp: number };
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function refreshExpiryDate() {
  const d = new Date();
  d.setDate(d.getDate() + authConfig.refreshTokenTtlDays);
  return d;
}
