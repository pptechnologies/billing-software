// src/middleware/auth.ts
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { httpError } from "../utils/httpError";

type AccessTokenPayload = {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
};

function getBearerToken(req: Request) {
  const h = req.headers.authorization;
  if (!h) return null;
  const [scheme, token] = h.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = getBearerToken(req);
    if (!token) return next(httpError(401, "NoAccessToken", "Missing access token"));

    const secret = process.env.JWT_SECRET;
    if (!secret) return next(httpError(500, "ServerMisconfig", "JWT_SECRET not set"));

    const decoded = jwt.verify(token, secret) as AccessTokenPayload;

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };

    return next();
  } catch (err: any) {
    // token expired / invalid signature / malformed
    return next(httpError(401, "AccessTokenInvalid", "Invalid or expired access token"));
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(httpError(401, "NoAccessToken", "Missing access token"));

    if (!roles.includes(req.user.role)) {
      return next(httpError(403, "Forbidden", "You do not have permission"));
    }

    return next();
  };
}
