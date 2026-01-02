import mongoose from "mongoose";

/**
 * Initierar MongoDB-anslutning.
 */
export async function connectDb() {
  const mongoUrl = process.env.MONGO_URL;
  if (!mongoUrl) throw new Error("MONGO_URL saknas i env.");

  await mongoose.connect(mongoUrl, {
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 30000,
});
  console.log("MongoDB ansluten.");
}
