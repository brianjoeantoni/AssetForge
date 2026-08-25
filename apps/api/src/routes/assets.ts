import { Router, type Request } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware.js";
import { prisma } from "../prisma.js";
import { fakeImageUrl, isUuid, titleFromPrompt } from "../utils.js";
import { generationQueue } from "../queues/generation.js";
import { connectMongo } from "../mongo.js";
import { GenerationMetadata } from "../models/generation-metadata.js";

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

assetsRouter.get("/:id/metadata", async (req, res) => {
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
      },
    });

    if (!asset) {
      res.status(404).json({
        error: "Asset not found",
      });
      return;
    }

    await connectMongo();

    const metadata = await GenerationMetadata.findOne({
      assetId: id,
      ownerId: userId,
    })
      .select("-__v")
      .lean();

    if (!metadata) {
      res.status(404).json({
        error: "Asset metadata not found",
      });
      return;
    }

    res.json(metadata);
  } catch {
    res.status(500).json({
      error: "Failed to fetch asset metadata",
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
        status: "QUEUED",
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

    // Put a new job into Redis so a worker can process it later
    try {
      await generationQueue.add(
        "generate-asset",
        {
          assetId: asset.id,
          ownerId: userId,
          prompt: cleanPrompt,
          name,
        },
        {
          jobId: asset.id,
        },
      );
    } catch {
      await prisma.assets.updateMany({
        where: {
          id: asset.id,
          owner_id: userId,
        },
        data: {
          status: "FAILED",
          updated_at: new Date(),
        },
      });

      res.status(500).json({
        error: "Asset was created but generation could not be queued",
      });
      return;
    }

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
