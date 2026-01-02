import { seedAll } from "./seedAll.js";

seedAll()
  .then(() => {
    console.log("Seed klar.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seed misslyckades:", err);
    process.exit(1);
  });
