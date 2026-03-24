import type { Request, Response, NextFunction } from "express";
import { createLeaveSchema, updateLeaveSchema, leaveQuerySchema } from "./leave.validation";
import * as repo from "./leave.repo";
import { httpError } from "../../utils/httpError";

export async function createLeaveRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createLeaveSchema.parse(req.body);
    const leave = await repo.createLeaveRequest(parsed);
    return res.status(201).json(leave);
  } catch (err) {
    return next(err);
  }
}

export async function listLeaveRequests(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = leaveQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return next(httpError(400, "ValidationError", "Invalid query parameters"));
    }
    const leaves = await repo.listLeaveRequests(parsed.data);
    return res.json(leaves);
  } catch (err) {
    return next(err);
  }
}

export async function getLeaveRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const leave = await repo.getLeaveRequestById(req.params.id);
    if (!leave) return next(httpError(404, "LeaveNotFound", "Leave request not found"));
    return res.json(leave);
  } catch (err) {
    return next(err);
  }
}

export async function updateLeaveRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = updateLeaveSchema.parse(req.body);
    const updated = await repo.updateLeaveRequestById(req.params.id, parsed);
    if (!updated) return next(httpError(404, "LeaveNotFound", "Leave request not found"));
    return res.json(updated);
  } catch (err) {
    return next(err);
  }
}

export async function approveLeaveRequest(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) return next(httpError(401, "NoAccessToken", "Missing access token"));
    const approved = await repo.approveLeaveRequest(req.params.id, req.user.id);
    if (!approved) return next(httpError(400, "LeaveNotPending", "Leave request must be pending to approve"));
    return res.json(approved);
  } catch (err) {
    return next(err);
  }
}

export async function rejectLeaveRequest(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) return next(httpError(401, "NoAccessToken", "Missing access token"));
    const rejected = await repo.rejectLeaveRequest(req.params.id, req.user.id);
    if (!rejected) return next(httpError(400, "LeaveNotPending", "Leave request must be pending to reject"));
    return res.json(rejected);
  } catch (err) {
    return next(err);
  }
}

export async function cancelLeaveRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const cancelled = await repo.cancelLeaveRequest(req.params.id);
    if (!cancelled) return next(httpError(400, "LeaveNotPending", "Only pending leave requests can be cancelled"));
    return res.json(cancelled);
  } catch (err) {
    return next(err);
  }
}