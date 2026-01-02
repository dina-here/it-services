import dotenv from "dotenv";
dotenv.config();

import { createApp } from "./server/app.js";
import { connectDb } from "./server/db.js";
import { maybeSeed } from "./seed/maybeSeed.js";

const port = Number(process.env.PORT || 4000);

async function start() {
  await connectDb();
  await maybeSeed();

  const app = createApp();
  const server = app.listen(port, "0.0.0.0");

  server.on("listening", () => {
    console.log(`API kör på http://localhost:${port}`);
  });

  server.on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${port} är redan upptagen`);
    } else {
      console.error("Server error:", err);
    }
    process.exit(1);
  });
}

start().catch((err) => {
  console.error("Kunde inte starta API:", err);
  process.exit(1);
});
