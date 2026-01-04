import type { Request, Response, NextFunction } from "express";
import { createClientSchema } from "./client.validation";
import * as repo from "./client.repo";

export async function createClient(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createClientSchema.parse(req.body);
    const client = await repo.createClient(parsed);
    res.status(201).json(client);
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return res.status(400).json({ error: "ValidationError", details: err.errors });
    }
    next(err);
  }
}

export async function listClients(req: Request, res: Response, next: NextFunction) {
  try {
    const clients = await repo.listClients();
    res.json(clients);
  } catch (err) {
    next(err);
  }
}

export async function getClient(req: Request, res: Response, next: NextFunction) {
  try {
    const client = await repo.getClientById(req.params.id);
    if (!client) return res.status(404).json({ error: "ClientNotFound" });
    res.json(client);
  } catch (err) {
    next(err);
  }
}
