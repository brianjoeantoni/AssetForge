import "dotenv/config";
import cors from "cors";
import express from "express";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { db } from "./db.js";
import type { NextFunction, Request, Response } from "express";

const app = express();
const port = Number(process.env.API_PORT ?? 4000);
const jwtSecret = process.env.JWT_SECRET ?? "dev-secret-change-me";
const authCookieName = "assetforge_token";

type AuthTokenPayload = {
  sub: string;
};

type AuthenticatedRequest = Request & {
  userId: string;
};

// Checks if a string is a valid UUID, returns true or false (case insensitive)
function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

// Returns the user id from the auth cookie
function getAuthUserId(req: express.Request) {
  const token = req.cookies?.[authCookieName]; // Reads the cookie named "assetforge_token"

  if (typeof token !== "string") {
    return null;
  }

  try {
    // Was this token signed by us?
    // Has it expired?
    // Was it tampered with?
    const payload = jwt.verify(token, jwtSecret) as AuthTokenPayload;

    if (!isUuid(payload.sub)) {
      return null;
    }

    return payload.sub;
  } catch {
    return null;
  }
}

// This middleware checks if the user is authenticated
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = getAuthUserId(req);

  if (!userId) {
    res.status(401).json({
      error: "Authentication required",
    });
    return;
  }

  (req as AuthenticatedRequest).userId = userId;
  next();
}

// This middleware handles CORS
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json()); // This middleware reads incoming JSON request bodies and puts them on: req.body
app.use(cookieParser()); // This middleware reads the Cookie header and puts parsed cookies on: req.cookies

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

app.get("/users", requireAuth, async (_req, res) => {
  const result = await db.query(
    "SELECT id, name, email, created_at FROM users ORDER BY created_at DESC",
  );

  res.json(result.rows);
});

app.get("/users/:id", requireAuth, async (req, res) => {
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
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch user",
    });
  }
});

app.patch("/users/:id", requireAuth, async (req, res) => {
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

app.delete("/users/:id", requireAuth, async (req, res) => {
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
  } catch (error) {
    res.status(500).json({
      error: "Failed to delete user",
    });
  }
});

// unused for now
app.post("/users", requireAuth, async (req, res) => {
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

app.post("/auth/register", async (req, res) => {
  const { name, email, password } = req.body;

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

  if (typeof password !== "string" || password.length < 8) {
    res.status(400).json({
      error: "Password must be at least 8 characters",
    });
    return;
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    const result = await db.query(
      `
        INSERT INTO users (name, email, password_hash)
        VALUES ($1, $2, $3)
        RETURNING id, name, email, created_at
      `,
      [name.trim(), email.trim().toLowerCase(), passwordHash],
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
      error: "Failed to register",
    });
  }
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (typeof email !== "string" || email.trim() === "") {
    res.status(400).json({
      error: "Email is required",
    });
    return;
  }

  if (typeof password !== "string" || password === "") {
    res.status(400).json({
      error: "Password is required",
    });
    return;
  }

  try {
    const result = await db.query(
      `
        SELECT id, name, email, password_hash, created_at
        FROM users
        WHERE email = $1
      `,
      [email.trim().toLowerCase()],
    );

    if (result.rows.length === 0) {
      res.status(401).json({
        error: "Invalid email or password",
      });
      return;
    }

    const user = result.rows[0];

    if (typeof user.password_hash !== "string") {
      res.status(401).json({
        error: "Invalid email or password",
      });
      return;
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      res.status(401).json({
        error: "Invalid email or password",
      });
      return;
    }

    // Creates the token
    const token = jwt.sign(
      {
        sub: user.id, // who this token belongs to
      },
      jwtSecret,
      {
        expiresIn: "7d",
      },
    );

    res.cookie(authCookieName, token, {
      // Tells the browser to store this cookie
      httpOnly: true,
      sameSite: "lax", // Allows cookie over local HTTP. In production HTTPS, this should be true
      secure: false,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.created_at,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to login",
    });
  }
});

app.get("/auth/me", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;

  try {
    const result = await db.query(
      `
        SELECT id, name, email, created_at
        FROM users
        WHERE id = $1
      `,
      [userId],
    );

    if (result.rows.length === 0) {
      res.status(401).json({
        error: "Authentication required",
      });
      return;
    }

    res.json(result.rows[0]);
  } catch {
    res.status(500).json({
      error: "Failed to fetch current user",
    });
  }
});

app.post("/auth/logout", (_req, res) => {
  res.clearCookie(authCookieName, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
  });

  res.status(204).send();
});

app.get("/assets", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;

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

app.get("/assets/:id", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
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

app.patch("/assets/:id", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
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

app.delete("/assets/:id", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
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

app.post("/assets", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  const { prompt } = req.body;

  if (typeof prompt !== "string" || prompt.trim().length < 5) {
    res.status(400).json({
      error: "Prompt must be at least 5 characters",
    });
    return;
  }

  const cleanPrompt = prompt.trim();
  const name = cleanPrompt
    .replace(/[^\w\s-]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");

  const imageUrl = `https://placehold.co/960x540?text=${encodeURIComponent(
    name || "Generated Asset",
  )}`;

  try {
    const result = await db.query(
      `
        INSERT INTO assets (owner_id, name, prompt, image_url)
        VALUES ($1, $2, $3, $4)
        RETURNING id, owner_id, name, prompt, status, image_url, model, created_at, updated_at
      `,
      [userId, name || "Generated Asset", cleanPrompt, imageUrl],
    );

    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({
      error: "Failed to create asset",
    });
  }
});

app.patch("/assets/:id", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
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

app.delete("/assets/:id", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
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

app.listen(port, () => {
  console.log(`AssetForge API running on http://localhost:${port}`);
});
