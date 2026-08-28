import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://assetforge:assetforge@localhost:5432/assetforge";

const adapter = new PrismaPg({ connectionString });

export const prisma = new PrismaClient({ adapter });