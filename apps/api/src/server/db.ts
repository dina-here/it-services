import mongoose from "mongoose";

/**
 * Initierar MongoDB-anslutning.
 */
export async function connectDb() {
  const mongoUrl = process.env.MONGO_URL;
  if (!mongoUrl) throw new Error("MONGO_URL saknas i env.");

  await mongoose.connect(mongoUrl);
  console.log("MongoDB ansluten.");
}
