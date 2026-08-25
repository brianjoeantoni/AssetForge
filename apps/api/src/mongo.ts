import mongoose from "mongoose";
import { config } from "./config.js";

export async function connectMongo() {
  // 0 = disconnected
  // 1 = connected
  // 2 = connecting
  // 3 = disconnecting
  if (mongoose.connection.readyState === 1) {
    return;
  }

  await mongoose.connect(config.mongoUrl);

  console.log("Connected to MongoDB");
}

export async function disconnectMongo() {
  await mongoose.disconnect();
}
