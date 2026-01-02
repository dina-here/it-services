import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { HttpError } from "../../server/httpError.js";
import type { UserRoll } from "./user.model.js";

export interface AuthedRequest extends Request {
  user?: { id: string; roll: UserRoll; employeeId?: string | null };
}

function jwtSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET saknas i env.");
  return s;
}

/**
 * Kräver giltig JWT i headern: Authorization: Bearer <token>
 */
export function requireAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return next(new HttpError(401, "Saknar token."));

  const token = auth.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, jwtSecret()) as any;
    req.user = {
      id: String(payload.sub),
      roll: payload.roll,
      employeeId: payload.employeeId ?? null,
    };
    return next();
  } catch {
    return next(new HttpError(401, "Ogiltig token."));
  }
}

/**
 * RBAC: tillåt endast angivna roller.
 */
export function requireRole(...roles: UserRoll[]) {
  return (req: AuthedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new HttpError(401, "Ej inloggad."));
    if (!roles.includes(req.user.roll)) return next(new HttpError(403, "Saknar behörighet."));
    next();
  };
}
