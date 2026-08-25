import { Router } from "express";
import { db } from "../db.js";

export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "assetforge-api",
  });
});

healthRouter.get("/db-health", async (_req, res) => {
  const result = await db.query("SELECT NOW() as now");

  res.json({
    ok: true,
    databaseTime: result.rows[0].now,
  });
});
