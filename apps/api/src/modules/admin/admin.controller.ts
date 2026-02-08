import type { Request, Response, NextFunction } from "express";
import * as adminRepo from "./admin.repo";
import { httpError } from "../../utils/httpError";


export const getAllUsers = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await adminRepo.getAllUsers();
    res.json(users);
  } catch (err) {
    next(err);
  }
}; 

export async function changeUserRole(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { userId, role } = req.body;

    if (!["admin", "user"].includes(role)) {
      return next(httpError(400, "InvalidRole", "Invalid role"));
    }

    const updated = await adminRepo.updateUserRole(userId, role);

    if (!updated) {
      return next(httpError(404, "UserNotFound", "User not found"));
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
}
