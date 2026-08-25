import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Router } from "express";
import { config } from "../config.js";
import { db } from "../db.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
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

authRouter.post("/login", async (req, res) => {
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

    const token = jwt.sign(
      {
        sub: user.id,
      },
      config.jwtSecret,
      {
        expiresIn: "7d",
      },
    );

    res.cookie(config.authCookieName, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.created_at,
    });
  } catch {
    res.status(500).json({
      error: "Failed to login",
    });
  }
});

authRouter.get("/me", requireAuth, async (req, res) => {
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

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(config.authCookieName, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
  });

  res.status(204).send();
});
