import { Router } from "express";
import { z } from "zod";
import { login } from "./auth.service.js";
import { requireAuth, AuthedRequest } from "./auth.middleware.js";
import { UserModel } from "./user.model.js";

export const authRouter = Router();

const LoginSchema = z.object({
  epost: z.string().email(),
  losen: z.string().min(6),
});

/**
 * POST /auth/login
 */
authRouter.post("/login", async (req, res, next) => {
  try {
    const body = LoginSchema.parse(req.body);
    const result = await login(body.epost, body.losen);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /auth/me
 */
authRouter.get("/me", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const user = await UserModel.findById(req.user!.id).lean();
    res.json({ user: user ? { id: String(user._id), epost: user.epost, roll: user.roll, employeeId: user.employeeId ?? null } : null });
  } catch (err) {
    next(err);
  }
});
