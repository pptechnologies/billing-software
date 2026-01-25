// src/utils/httpError.ts
export type HttpError = Error & {
  status?: number;
  code?: string;
  meta?: any;
  details?: any;
};

export function httpError(status: number, code: string, message?: string, meta?: any): HttpError {
  return Object.assign(new Error(message ?? code), { status, code, meta });
}
