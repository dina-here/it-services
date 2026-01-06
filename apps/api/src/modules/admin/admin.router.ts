import { Router } from "express";
import { requireAuth, requireRole, AuthedRequest } from "../auth/auth.middleware.js";
import { seedAll } from "../../seed/seedAll.js";

const adminRouter = Router();

adminRouter.use(requireAuth);

adminRouter.post("/demo-reset", requireAuth, async (_req: AuthedRequest, res, next) => {
  try {
    const demoModeEnv = process.env.DEMO_MODE;
    const demoMode = String(demoModeEnv ?? (process.env.NODE_ENV !== "production" ? "true" : "false")).toLowerCase() === "true";
    if (!demoMode) {
      return res.status(403).json({ 
        error: "Demo-läge är inte aktiverat. Sätt DEMO_MODE=true i miljövariabler." 
      });
    }

    await seedAll();
    res.json({ ok: true, message: "Demo återställd." });
  } catch (err) {
    next(err);
  }
});

export { adminRouter };
