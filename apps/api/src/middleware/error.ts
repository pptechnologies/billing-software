import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

type AppError = Error & {
  status?: number;
  code?: string;
  details?: any;
  meta?: any;
};

function isPgError(err: any) {
  return err && typeof err === "object" && typeof err.code === "string" && typeof err.severity === "string";
}

export default function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const isProd = process.env.NODE_ENV === "production";

  // 1) Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "ValidationError",
      details: err.issues,
    });
  }

  const e = err as AppError;

  // 2) Postgres errors (unique/foreign key/etc)
  if (isPgError(e)) {
    // Common PG codes:
    // 23505 = unique_violation
    // 23503 = foreign_key_violation
    // 23502 = not_null_violation
    // 22P02 = invalid_text_representation (bad uuid, etc)
    const pg = e as any;

    if (pg.code === "23505") {
      return res.status(409).json({
        error: "UniqueViolation",
        message: "Duplicate value violates a unique constraint.",
        meta: isProd ? undefined : { constraint: pg.constraint, detail: pg.detail },
      });
    }

    if (pg.code === "23503") {
      return res.status(409).json({
        error: "ForeignKeyViolation",
        message: "Operation violates a foreign key constraint.",
        meta: isProd ? undefined : { constraint: pg.constraint, detail: pg.detail },
      });
    }

    if (pg.code === "23502") {
      return res.status(400).json({
        error: "NotNullViolation",
        message: "A required field is missing.",
        meta: isProd ? undefined : { column: pg.column, table: pg.table },
      });
    }

    if (pg.code === "22P02") {
      return res.status(400).json({
        error: "InvalidInput",
        message: "Invalid input format.",
        meta: isProd ? undefined : { detail: pg.detail },
      });
    }

    // fallback PG
    return res.status(400).json({
      error: "DatabaseError",
      message: "Database error.",
      meta: isProd ? undefined : { code: pg.code, detail: pg.detail },
    });
  }

  // 3) Your custom thrown errors from repo/controller
  const status = Number.isFinite(e?.status) ? (e.status as number) : 500;

  const payload: any = {
    error: e?.code ?? (status === 500 ? "InternalServerError" : "RequestError"),
    message: e?.message ?? "Internal Server Error",
  };

  if (e?.details !== undefined) payload.details = e.details;
  if (e?.meta !== undefined) payload.meta = e.meta;

  if (!isProd && e instanceof Error) {
    payload.stack = e.stack;
  }

  return res.status(status).json(payload);
}
