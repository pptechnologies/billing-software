import type { Request, Response, NextFunction } from "express";
import argon2 from "argon2";
import rateLimit from "express-rate-limit";
import { httpError } from "../../utils/httpError";
import { authConfig } from "../../config/auth";
import * as repo from "./auth.repo";
import { signupSchema, loginSchema } from "./auth.validation";
import { signAccessToken, signRefreshToken, verifyRefreshToken, hashToken, refreshExpiryDate } from "./auth.token";

export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30, 
  standardHeaders: true,
  legacyHeaders: false,
});

function setRefreshCookie(res: Response, token: string) {
  res.cookie(authConfig.cookieName, token, {
    ...authConfig.cookie,
    expires: refreshExpiryDate(),
  });
}

export async function signup(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = signupSchema.parse(req.body);
    const email = parsed.email.trim().toLowerCase();

    const existing = await repo.findUserByEmail(email);
    if (existing) return next(httpError(409, "EmailAlreadyInUse", "Email already in use"));

    const password_hash = await argon2.hash(parsed.password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });

    const user = await repo.createUser({
      email,
      password_hash,
      name: parsed.name ?? null,
    });

    const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ sub: user.id });

    await repo.storeRefreshToken({
      user_id: user.id,
      token_hash: hashToken(refreshToken),
      expires_at: refreshExpiryDate(),
      ip: req.ip,
      user_agent: req.get("user-agent") ?? null,
    });

    setRefreshCookie(res, refreshToken);

    return res.status(201).json({
      user,
      accessToken,
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = loginSchema.parse(req.body);
    const email = parsed.email.trim().toLowerCase();

    const user = await repo.findUserByEmail(email);
    if (!user) return next(httpError(401, "InvalidCredentials", "Invalid email or password"));
    if (!user.is_active) return next(httpError(403, "UserDisabled", "User is disabled"));

    const ok = await argon2.verify(user.password_hash, parsed.password);
    if (!ok) return next(httpError(401, "InvalidCredentials", "Invalid email or password"));

    const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ sub: user.id });

    await repo.storeRefreshToken({
      user_id: user.id,
      token_hash: hashToken(refreshToken),
      expires_at: refreshExpiryDate(),
      ip: req.ip,
      user_agent: req.get("user-agent") ?? null,
    });

    setRefreshCookie(res, refreshToken);

    return res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, is_active: user.is_active },
      accessToken,
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[authConfig.cookieName];
    if (!token) return next(httpError(401, "NoRefreshToken", "Missing refresh token"));

    const decoded = verifyRefreshToken(token);
    const tokenHash = hashToken(token);

    const row = await repo.findRefreshToken(tokenHash);
    if (!row) return next(httpError(401, "RefreshTokenInvalid", "Refresh token invalid"));

    await repo.revokeRefreshToken(row.id);

    const user = await repo.findUserById(decoded.sub);
    if (!user || !user.is_active) return next(httpError(401, "UserInvalid", "User invalid"));

    // new tokens
    const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
    const newRefreshToken = signRefreshToken({ sub: user.id });

    // store new refresh token
    await repo.storeRefreshToken({
      user_id: user.id,
      token_hash: hashToken(newRefreshToken),
      expires_at: refreshExpiryDate(),
      ip: req.ip,
      user_agent: req.get("user-agent") ?? null,
    });

    // set new refresh cookie
    setRefreshCookie(res, newRefreshToken);

    return res.json({ accessToken });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[authConfig.cookieName];
    if (token) {
      const tokenHash = hashToken(token);
      const row = await repo.findRefreshToken(tokenHash);
      if (row) await repo.revokeRefreshToken(row.id);
    }

    res.clearCookie(authConfig.cookieName, authConfig.cookie);
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    return res.json({ user: req.user });
  } catch (err) {
    next(err);
  }
}
