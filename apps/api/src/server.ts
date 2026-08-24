import "dotenv/config";
import cors from "cors";
import express from "express";
import { db } from "./db.js";

const app = express();
const port = Number(process.env.API_PORT ?? 4000);

// Checks if a string is a valid UUID, returns true or false (case insensitive)
function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "assetforge-api",
  });
});

app.get("/db-health", async (_req, res) => {
  const result = await db.query("SELECT NOW() as now");

  res.json({
    ok: true,
    databaseTime: result.rows[0].now,
  });
});

app.get("/users", async (_req, res) => {
  const result = await db.query(
    "SELECT id, name, email, created_at FROM users ORDER BY created_at DESC",
  );

  res.json(result.rows);
});

app.get("/users/:id", async (req, res) => {
  const { id } = req.params;

  if (!isUuid(id)) {
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
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch user",
    });
  }
});

app.patch("/users/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;

  if (!isUuid(id)) {
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

app.delete("/users/:id", async (req, res) => {
  const { id } = req.params;

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
  } catch (error) {
    res.status(500).json({
      error: "Failed to delete user",
    });
  }
});

// unused for now
app.post("/users", async (req, res) => {
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

app.listen(port, () => {
  console.log(`AssetForge API running on http://localhost:${port}`);
});
