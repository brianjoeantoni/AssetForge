import { Router, type Request } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware.js";
import { prisma } from "../prisma.js";
import { fakeImageUrl, isUuid, titleFromPrompt } from "../utils.js";

export const assetsRouter = Router();

assetsRouter.use(requireAuth);

function auth(req: Request) {
  return req as unknown as AuthenticatedRequest;
}

assetsRouter.get("/", async (req, res) => {
  const { userId } = auth(req);

  try {
    const assets = await prisma.assets.findMany({
      where: {
        owner_id: userId,
      },
      select: {
        id: true,
        owner_id: true,
        name: true,
        prompt: true,
        status: true,
        image_url: true,
        model: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    res.json(assets);
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
    const asset = await prisma.assets.findFirst({
      where: {
        id,
        owner_id: userId,
      },
      select: {
        id: true,
        owner_id: true,
        name: true,
        prompt: true,
        status: true,
        image_url: true,
        model: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!asset) {
      res.status(404).json({
        error: "Asset not found",
      });
      return;
    }

    res.json(asset);
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
    const asset = await prisma.assets.create({
      data: {
        owner_id: userId,
        name,
        prompt: cleanPrompt,
        image_url: fakeImageUrl(name),
      },
      select: {
        id: true,
        owner_id: true,
        name: true,
        prompt: true,
        status: true,
        image_url: true,
        model: true,
        created_at: true,
        updated_at: true,
      },
    });

    res.status(201).json(asset);
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
    const updateResult = await prisma.assets.updateMany({
      where: {
        id,
        owner_id: userId,
      },
      data: {
        name: name.trim(),
        updated_at: new Date(),
      },
    });

    if (updateResult.count === 0) {
      res.status(404).json({
        error: "Asset not found",
      });
      return;
    }

    res.status(204).send();
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
    const deleteResult = await prisma.assets.deleteMany({
      where: {
        id,
        owner_id: userId,
      },
    });

    if (deleteResult.count === 0) {
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
