import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "../db.js";

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
const migrationsDirectory = path.join(
  currentDirectory,
  "..",
  "db",
  "migrations",
);

const migrationFiles = await fs.readdir(migrationsDirectory);

for (const migrationFile of migrationFiles.sort()) {
  if (!migrationFile.endsWith(".sql")) {
    continue;
  }

  const migrationPath = path.join(migrationsDirectory, migrationFile);
  const sql = await fs.readFile(migrationPath, "utf8");

  console.log(`Running migration: ${migrationFile}`);
  await db.query(sql);
}

await db.end();

console.log("Migrations complete");