import type { Request, Response, NextFunction } from "express";
import { markAttendanceSchema, updateAttendanceSchema, attendanceQuerySchema } from "./attendance.validation";
import * as repo from "./attendance.repo";
import { httpError } from "../../utils/httpError";

export async function markAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = markAttendanceSchema.parse(req.body);
    const attendance = await repo.markAttendance(parsed);
    return res.status(201).json(attendance);
  } catch (err) {
    return next(err);
  }
}

export async function listAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = attendanceQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return next(httpError(400, "ValidationError", "Invalid query parameters"));
    }
    const attendance = await repo.listAttendance(parsed.data);
    return res.json(attendance);
  } catch (err) {
    return next(err);
  }
}

export async function getAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const attendance = await repo.getAttendanceById(req.params.id);
    if (!attendance) return next(httpError(404, "AttendanceNotFound", "Attendance record not found"));
    return res.json(attendance);
  } catch (err) {
    return next(err);
  }
}

export async function updateAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = updateAttendanceSchema.parse(req.body);
    const updated = await repo.updateAttendanceById(req.params.id, parsed);
    if (!updated) return next(httpError(404, "AttendanceNotFound", "Attendance record not found"));
    return res.json(updated);
  } catch (err) {
    return next(err);
  }
}

export async function getAttendanceSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const { employee_id, month, year } = req.query;
    if (!employee_id || !month || !year) {
      return next(httpError(400, "ValidationError", "employee_id, month and year are required"));
    }
    const summary = await repo.getAttendanceSummary(
      employee_id as string,
      Number(month),
      Number(year)
    );
    return res.json(summary);
  } catch (err) {
    return next(err);
  }
}