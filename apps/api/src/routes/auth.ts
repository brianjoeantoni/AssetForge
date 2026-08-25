import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Router } from "express";
import { config } from "../config.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware.js";
import { prisma } from "../prisma.js";

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

    const user = await prisma.users.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password_hash: passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        created_at: true,
      },
    });

    res.status(201).json(user);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
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
    const user = await prisma.users.findUnique({
      where: {
        email: email.trim().toLowerCase(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        password_hash: true,
        created_at: true,
      },
    });

    if (!user) {
      res.status(401).json({
        error: "Invalid email or password",
      });
      return;
    }

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
    const user = await prisma.users.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        created_at: true,
      },
    });

    if (!user) {
      res.status(401).json({
        error: "Authentication required",
      });
      return;
    }

    res.json(user);
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
