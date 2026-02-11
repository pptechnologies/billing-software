import "express";

export type AuthUser = {
  id: string;
  email: string;
  role: "admin" | "user";
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
