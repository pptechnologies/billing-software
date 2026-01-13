import type { Request, Response, NextFunction } from "express";
import { createClientSchema, updateClientSchema} from "./client.validation";
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

export async function updateClient(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = updateClientSchema.parse(req.body);

    const updated = await repo.updateClientById(req.params.id, parsed);
    if (!updated) return res.status(404).json({ error: "ClientNotFound" });

    res.json(updated);
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return res.status(400).json({ error: "ValidationError", details: err.errors });
    }
    const status = err?.status ?? 500;
    return res.status(status).json({ error: err?.code ?? "InternalError", message: err?.message });
  }
}

export async function deleteClient(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await repo.deleteClientById(req.params.id);

    if (!result.deleted) {
      if (result.reason === "ClientNotFound") {
        return res.status(404).json({ error: "ClientNotFound" });
      }
      if (result.reason === "ClientHasInvoices") {
        return res.status(409).json({
          error: "ClientHasInvoices",
          message: "Client cannot be deleted because invoices exist.",
          invoices: result.invoices,
        });
      }
    }

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}