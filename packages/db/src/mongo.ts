import mongoose from "mongoose";

export async function connectMongo(url = process.env.MONGODB_URL) {
  if (!url) {
    throw new Error("MONGODB_URL is required");
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  await mongoose.connect(url);
  return mongoose.connection;
}

export async function disconnectMongo() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
