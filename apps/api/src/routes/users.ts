import { Router } from "express";
import { db } from "../db.js";
import { requireAuth } from "../middleware.js";
import { isUuid } from "../utils.js";

export const usersRouter = Router();

usersRouter.use(requireAuth);

usersRouter.get("/", async (_req, res) => {
  const result = await db.query(
    "SELECT id, name, email, created_at FROM users ORDER BY created_at DESC",
  );

  res.json(result.rows);
});

usersRouter.get("/:id", async (req, res) => {
  const { id } = req.params;

  if (typeof id !== "string" || !isUuid(id)) {
    res.status(400).json({
      error: "Invalid user id",
    });
    return;
  }

  try {
    const result = await db.query(
      `
        SELECT id, name, email, created_at
        FROM users
        WHERE id = $1
      `,
      [id],
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        error: "User not found",
      });
      return;
    }

    res.json(result.rows[0]);
  } catch {
    res.status(500).json({
      error: "Failed to fetch user",
    });
  }
});

usersRouter.post("/", async (req, res) => {
  const { name, email } = req.body;

  if (typeof name !== "string" || name.trim() === "") {
    res.status(400).json({
      error: "Name is required",
    });
    return;
  }

  if (typeof email !== "string" || email.trim() === "") {
    res.status(400).json({
      error: "Email is required",
    });
    return;
  }

  try {
    const result = await db.query(
      `
        INSERT INTO users (name, email)
        VALUES ($1, $2)
        RETURNING id, name, email, created_at
      `,
      [name.trim(), email.trim().toLowerCase()],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      res.status(409).json({
        error: "Email is already registered",
      });
      return;
    }

    res.status(500).json({
      error: "Failed to create user",
    });
  }
});

usersRouter.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;

  if (typeof id !== "string" || !isUuid(id)) {
    res.status(400).json({
      error: "Invalid user id",
    });
    return;
  }

  if (typeof name !== "string" || name.trim() === "") {
    res.status(400).json({
      error: "Name is required",
    });
    return;
  }

  if (typeof email !== "string" || email.trim() === "") {
    res.status(400).json({
      error: "Email is required",
    });
    return;
  }

  try {
    const result = await db.query(
      `
        UPDATE users
        SET name = $1, email = $2
        WHERE id = $3
        RETURNING id, name, email, created_at
      `,
      [name.trim(), email.trim().toLowerCase(), id],
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        error: "User not found",
      });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      res.status(409).json({
        error: "Email is already registered",
      });
      return;
    }

    res.status(500).json({
      error: "Failed to update user",
    });
  }
});

usersRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;

  if (typeof id !== "string" || !isUuid(id)) {
    res.status(400).json({
      error: "Invalid user id",
    });
    return;
  }

  try {
    const result = await db.query(
      `
        DELETE FROM users
        WHERE id = $1
        RETURNING id
      `,
      [id],
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        error: "User not found",
      });
      return;
    }

    res.status(204).send();
  } catch {
    res.status(500).json({
      error: "Failed to delete user",
    });
  }
});
