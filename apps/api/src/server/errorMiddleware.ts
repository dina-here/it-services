import { Request, Response, NextFunction } from "express";

/**
 * Enkel, tydlig felhantering.
 * I prod kan du lägga till loggning, trace-id, m.m.
 */
export function errorMiddleware(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = err?.statusCode || 500;
  const message = err?.message || "Okänt fel";
  const details = err?.details;

  res.status(status).json({
    fel: message,
    ...(details ? { detaljer: details } : {}),
  });
}
