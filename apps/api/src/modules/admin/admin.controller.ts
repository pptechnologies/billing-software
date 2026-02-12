import type { Request, Response, NextFunction } from "express";
import * as adminRepo from "./admin.repo";
import { httpError } from "../../utils/httpError";
import { changeRoleSchema, changeStatusSchema } from "./admin.validation";

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
    const userId = req.params.id;
    const { role } = changeRoleSchema.parse(req.body);
    const currentUser = req.user!;

    if (currentUser.id === userId && role !== "admin") {
      return next(
        httpError(409, "InvalidOperation", "You cannot demote yourself")
      );
    }

    // Prevent removing last admin
    if (role === "user") {
      const adminCount = await adminRepo.countAdmins();
      if (adminCount <= 1) {
        return next(
          httpError(409, "InvalidOperation", "Cannot remove last admin")
        );
      }
    }

    // Get current role for audit
    const users = await adminRepo.getAllUsers();
    const target = users.find(u => u.id === userId);
    if (!target) {
      return next(httpError(404, "UserNotFound", "User not found"));
    }

    const updated = await adminRepo.updateUserRole(userId, role);

    await adminRepo.createAuditLog({
      actor_id: currentUser.id,
      target_id: userId,
      action: "CHANGE_ROLE",
      previous_value: target.role,
      new_value: role,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function changeUserStatus(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.params.id;
    const { is_active } = changeStatusSchema.parse(req.body);
    const currentUser = req.user!;

    if (currentUser.id === userId && !is_active) {
      return next(
        httpError(409, "InvalidOperation", "You cannot disable yourself")
      );
    }

    const users = await adminRepo.getAllUsers();
    const target = users.find(u => u.id === userId);
    if (!target) {
      return next(httpError(404, "UserNotFound", "User not found"));
    }

    const updated = await adminRepo.updateUserStatus(userId, is_active);

    await adminRepo.createAuditLog({
      actor_id: currentUser.id,
      target_id: userId,
      action: "CHANGE_STATUS",
      previous_value: String(target.is_active),
      new_value: String(is_active),
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}
