import { Router, type Response } from "express";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middleware.js";
import { prisma } from "../prisma.js";
import { isUuid } from "../utils.js";

export const usersRouter = Router();

usersRouter.use(requireAuth);

function requireSelf(
  req: AuthenticatedRequest,
  id: string,
  res: Response,
) {
  if (id !== req.userId) {
    res.status(403).json({
      error: "You can only access your own profile",
    });
    return false;
  }

  return true;
}

usersRouter.get("/:id", async (req, res) => {
  const { id } = req.params;
  const authenticatedReq = req as unknown as AuthenticatedRequest;

  if (typeof id !== "string" || !isUuid(id)) {
    res.status(400).json({
      error: "Invalid user id",
    });
    return;
  }

  if (!requireSelf(authenticatedReq, id, res)) {
    return;
  }

  try {
    const user = await prisma.users.findUnique({
      where: { id },
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

usersRouter.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  const authenticatedReq = req as unknown as AuthenticatedRequest;

  if (typeof id !== "string" || !isUuid(id)) {
    res.status(400).json({
      error: "Invalid user id",
    });
    return;
  }

  if (!requireSelf(authenticatedReq, id, res)) {
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
      where: { id },
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
  const authenticatedReq = req as unknown as AuthenticatedRequest;

  if (typeof id !== "string" || !isUuid(id)) {
    res.status(400).json({
      error: "Invalid user id",
    });
    return;
  }

  if (!requireSelf(authenticatedReq, id, res)) {
    return;
  }

  try {
    await prisma.users.delete({
      where: { id },
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
