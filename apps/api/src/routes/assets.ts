import { Router, type Request } from "express";
import { db } from "../db.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware.js";
import { fakeImageUrl, isUuid, titleFromPrompt } from "../utils.js";

export const assetsRouter = Router();

assetsRouter.use(requireAuth);

function auth(req: Request) {
  return req as unknown as AuthenticatedRequest;
}

assetsRouter.get("/", async (req, res) => {
  const { userId } = auth(req);

  try {
    const result = await db.query(
      `
        SELECT id, owner_id, name, prompt, status, image_url, model, created_at, updated_at
        FROM assets
        WHERE owner_id = $1
        ORDER BY created_at DESC
      `,
      [userId],
    );

    res.json(result.rows);
  } catch {
    res.status(500).json({
      error: "Failed to fetch assets",
    });
  }
});

assetsRouter.get("/:id", async (req, res) => {
  const { userId } = auth(req);
  const { id } = req.params;

  if (typeof id !== "string" || !isUuid(id)) {
    res.status(400).json({
      error: "Invalid asset id",
    });
    return;
  }

  try {
    const result = await db.query(
      `
        SELECT id, owner_id, name, prompt, status, image_url, model, created_at, updated_at
        FROM assets
        WHERE id = $1 AND owner_id = $2
      `,
      [id, userId],
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        error: "Asset not found",
      });
      return;
    }

    res.json(result.rows[0]);
  } catch {
    res.status(500).json({
      error: "Failed to fetch asset",
    });
  }
});

assetsRouter.post("/", async (req, res) => {
  const { userId } = auth(req);
  const { prompt } = req.body;

  if (typeof prompt !== "string" || prompt.trim().length < 5) {
    res.status(400).json({
      error: "Prompt must be at least 5 characters",
    });
    return;
  }

  const cleanPrompt = prompt.trim();
  const name = titleFromPrompt(cleanPrompt);

  try {
    const result = await db.query(
      `
        INSERT INTO assets (owner_id, name, prompt, image_url)
        VALUES ($1, $2, $3, $4)
        RETURNING id, owner_id, name, prompt, status, image_url, model, created_at, updated_at
      `,
      [userId, name, cleanPrompt, fakeImageUrl(name)],
    );

    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({
      error: "Failed to create asset",
    });
  }
});

assetsRouter.patch("/:id", async (req, res) => {
  const { userId } = auth(req);
  const { id } = req.params;
  const { name } = req.body;

  if (typeof id !== "string" || !isUuid(id)) {
    res.status(400).json({
      error: "Invalid asset id",
    });
    return;
  }

  if (typeof name !== "string" || name.trim() === "") {
    res.status(400).json({
      error: "Name is required",
    });
    return;
  }

  try {
    const result = await db.query(
      `
        UPDATE assets
        SET name = $1, updated_at = NOW()
        WHERE id = $2 AND owner_id = $3
        RETURNING id, owner_id, name, prompt, status, image_url, model, created_at, updated_at
      `,
      [name.trim(), id, userId],
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        error: "Asset not found",
      });
      return;
    }

    res.json(result.rows[0]);
  } catch {
    res.status(500).json({
      error: "Failed to update asset",
    });
  }
});

assetsRouter.delete("/:id", async (req, res) => {
  const { userId } = auth(req);
  const { id } = req.params;

  if (typeof id !== "string" || !isUuid(id)) {
    res.status(400).json({
      error: "Invalid asset id",
    });
    return;
  }

  try {
    const result = await db.query(
      `
        DELETE FROM assets
        WHERE id = $1 AND owner_id = $2
        RETURNING id
      `,
      [id, userId],
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        error: "Asset not found",
      });
      return;
    }

    res.status(204).send();
  } catch {
    res.status(500).json({
      error: "Failed to delete asset",
    });
  }
});
