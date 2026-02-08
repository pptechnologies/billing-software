import { Request, Response, NextFunction } from "express";
import * as adminRepo from "./admin.repo";

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
