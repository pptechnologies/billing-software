import type { Request, Response, NextFunction } from "express";
import { createClientSchema, updateClientSchema } from "./client.validation";
import * as repo from "./client.repo";
import { httpError } from "../../utils/httpError";

export async function createClient(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createClientSchema.parse(req.body);
    const client = await repo.createClient(parsed);
    return res.status(201).json(client);
  } catch (err) {
    return next(err);
  }
}

export async function listClients(req: Request, res: Response, next: NextFunction) {
  try {
    const clients = await repo.listClients();
    return res.json(clients);
  } catch (err) {
    return next(err);
  }
}

export async function getClient(req: Request, res: Response, next: NextFunction) {
  try {
    const client = await repo.getClientById(req.params.id);
    if (!client) return next(httpError(404, "ClientNotFound", "Client not found"));
    return res.json(client);
  } catch (err) {
    return next(err);
  }
}

export async function updateClient(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = updateClientSchema.parse(req.body);

    const updated = await repo.updateClientById(req.params.id, parsed);
    if (!updated) return next(httpError(404, "ClientNotFound", "Client not found"));

    return res.json(updated);
  } catch (err) {
    return next(err);
  }
}

export async function deleteClient(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await repo.deleteClientById(req.params.id);

    if (!result.deleted) {
      if (result.reason === "ClientNotFound") {
        return next(httpError(404, "ClientNotFound", "Client not found"));
      }

      if (result.reason === "ClientHasInvoices") {
        return next(
          httpError(409, "ClientHasInvoices", "Client cannot be deleted because invoices exist.", {
            invoices: result.invoices,
          })
        );
      }

      return next(httpError(409, "ClientDeleteBlocked", "Client cannot be deleted."));
    }

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}
