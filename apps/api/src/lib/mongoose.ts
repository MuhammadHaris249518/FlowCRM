import mongoose from "mongoose";

const MONGODB_URI = process.env.DATABASE_URL || "mongodb://localhost:27017/flowcrm_dev";

if (!MONGODB_URI) {
  throw new Error("Please define the DATABASE_URL environment variable");
}

const globalForMongoose = globalThis as unknown as { mongoose?: typeof mongoose };

export async function connectDatabase() {
  if (globalForMongoose.mongoose) {
    return globalForMongoose.mongoose;
  }

  const mongo = await mongoose.connect(MONGODB_URI);
  globalForMongoose.mongoose = mongo;
  return mongo;
}

export { mongoose };