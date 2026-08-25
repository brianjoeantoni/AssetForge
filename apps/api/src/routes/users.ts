import { Router } from "express";
import { requireAuth } from "../middleware.js";
import { prisma } from "../prisma.js";
import { isUuid } from "../utils.js";

export const usersRouter = Router();

usersRouter.use(requireAuth);

usersRouter.get("/", async (_req, res) => {
  const users = await prisma.users.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      created_at: true,
    },
    orderBy: {
      created_at: "desc",
    },
  });

  res.json(users);
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
    const user = await prisma.users.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        created_at: true,
      },
    });

    if (!user) {
      res.status(404).json({
        error: "User not found",
      });
      return;
    }

    res.json(user);
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
    const user = await prisma.users.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
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
    const user = await prisma.users.update({
      where: {
        id,
      },
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        created_at: true,
      },
    });

    res.json(user);
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

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      res.status(404).json({
        error: "User not found",
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
    await prisma.users.delete({
      where: {
        id,
      },
    });

    res.status(204).send();
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      res.status(404).json({
        error: "User not found",
      });
      return;
    }

    res.status(500).json({
      error: "Failed to delete user",
    });
  }
});
