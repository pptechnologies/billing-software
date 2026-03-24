import type { Request, Response, NextFunction } from "express";
import { createEmployeeSchema, updateEmployeeSchema } from "./employee.validation";
import * as repo from "./employee.repo";
import { httpError } from "../../utils/httpError";

export async function createEmployee(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createEmployeeSchema.parse(req.body);
    const employee = await repo.createEmployee(parsed);
    return res.status(201).json(employee);
  } catch (err) {
    return next(err);
  }
}

export async function listEmployees(req: Request, res: Response, next: NextFunction) {
  try {
    const employees = await repo.listEmployees();
    return res.json(employees);
  } catch (err) {
    return next(err);
  }
}

export async function getEmployee(req: Request, res: Response, next: NextFunction) {
  try {
    const employee = await repo.getEmployeeById(req.params.id);
    if (!employee) return next(httpError(404, "EmployeeNotFound", "Employee not found"));
    return res.json(employee);
  } catch (err) {
    return next(err);
  }
}

export async function updateEmployee(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = updateEmployeeSchema.parse(req.body);
    const updated = await repo.updateEmployeeById(req.params.id, parsed);
    if (!updated) return next(httpError(404, "EmployeeNotFound", "Employee not found"));
    return res.json(updated);
  } catch (err) {
    return next(err);
  }
}

export async function deleteEmployee(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await repo.deleteEmployeeById(req.params.id);
    if (!result.deleted) return next(httpError(404, "EmployeeNotFound", "Employee not found"));
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

// Departments
export async function listDepartments(req: Request, res: Response, next: NextFunction) {
  try {
    const departments = await repo.listDepartments();
    return res.json(departments);
  } catch (err) {
    return next(err);
  }
}

export async function createDepartment(req: Request, res: Response, next: NextFunction) {
  try {
    const { name } = req.body;
    if (!name) return next(httpError(400, "ValidationError", "Department name is required"));
    const department = await repo.createDepartment(name);
    return res.status(201).json(department);
  } catch (err) {
    return next(err);
  }
}