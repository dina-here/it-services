import { Request, Response, NextFunction } from "express";

/**
 * Enkel, tydlig felhantering.
 * I prod kan du lägga till loggning, trace-id, m.m.
 */
export function errorMiddleware(err: any, _req: Request, res: Response, _next: NextFunction) {
  const zodIssues = Array.isArray(err?.issues) ? err.issues : Array.isArray(err?.errors) ? err.errors : null;
  const friendlyMessage = zodIssues?.length
    ? zodIssues.map((issue: any) => issue?.message || "Invalid input").join(" • ")
    : err?.message;

  const status = err?.statusCode || (zodIssues ? 400 : 500);
  const message = friendlyMessage || "Unknown error";
  const details = err?.details || (zodIssues ? { issues: zodIssues } : undefined);

  res.status(status).json({
    fel: message,
    ...(details ? { detaljer: details } : {}),
  });
}
