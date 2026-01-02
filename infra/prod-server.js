/**
 * Production-server:
 * - Serverar React (dist) statiskt
 * - Proxyar API under /api till den byggda Express-appen
 *
 * Detta ger EN publik URL som funkar för portfölj.
 */
import path from "node:path";
import express from "express";

import dotenv from "dotenv";
dotenv.config();

import { createApp } from "../apps/api/dist/server/app.js";
import { connectDb } from "../apps/api/dist/server/db.js";

const port = Number(process.env.PORT || 4000);

async function start() {
  await connectDb();

  const apiApp = createApp();
  const app = express();

  // API ligger under /api
  app.use("/api", apiApp);

  // Web (React dist)
  const webDist = path.resolve("./web/dist");
  app.use(express.static(webDist));

  // SPA fallback
  app.get("*", (_req, res) => res.sendFile(path.join(webDist, "index.html")));

  app.listen(port, () => console.log(`Prod server: http://localhost:${port}`));
}

start().catch((e) => {
  console.error("Prod server kunde inte starta:", e);
  process.exit(1);
});
