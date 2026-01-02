import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { authRouter } from "../modules/auth/auth.router.js";
import { crmRouter } from "../modules/crm/crm.router.js";
import { hrRouter } from "../modules/hr/hr.router.js";
import { erpRouter } from "../modules/erp/erp.router.js";
import { resursRouter } from "../modules/resurs/resurs.router.js";
import { dataRouter } from "../modules/data/data.router.js";
import { errorMiddleware } from "./errorMiddleware.js";

/**
 * Skapar Express-app med all middleware och routes.
 * All kod är medvetet "ren & strukturerad" för portföljsyfte.
 */
export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan("dev"));

  // CORS: i prod bör du låsa ned detta strikt.
  const corsOrigin = process.env.CORS_ORIGIN || "*";
  app.use(cors({ origin: corsOrigin, credentials: true }));

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/auth", authRouter);
  app.use("/crm", crmRouter);
  app.use("/hr", hrRouter);
  app.use("/erp", erpRouter);
  app.use("/res", resursRouter);
  app.use("/data", dataRouter);

  app.use(errorMiddleware);
  return app;
}
