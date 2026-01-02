import { seedAll } from "./seedAll.js";

export async function maybeSeed() {
  const flag = String(process.env.SEED_ON_START || "false").toLowerCase();
  if (flag === "true") {
    await seedAll();
  }
}
