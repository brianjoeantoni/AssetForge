import path from "node:path";
import dotenv from "dotenv";
import { afterAll } from "vitest";

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

afterAll(async () => {
  const { disconnectMongo, prisma } = await import("@assetforge/db");
  await prisma.$disconnect();
  await disconnectMongo();
});
