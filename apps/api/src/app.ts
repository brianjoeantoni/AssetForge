import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import morgan from "morgan";
import { z } from "zod";
import { GenerationMetadata, connectMongo, prisma } from "@assetforge/db";
import { createGenerationQueue, defaultGenerationJobOptions } from "@assetforge/queue";
import { clearAuthCookie, hashPassword, requireAuth, setAuthCookie, verifyPassword } from "./auth.js";
import { config, isProduction } from "./config.js";
import { asyncHandler, HttpError } from "./http.js";
import type { AuthenticatedRequest, QueueLike } from "./types.js";
import { deleteAssetFile } from "./storage.js";

type AppOptions = {
  queue?: QueueLike;
  skipMongo?: boolean;
};

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8).max(128)
});

const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1)
});

const createGenerationSchema = z.object({
  prompt: z.string().trim().min(5).max(1000)
});

const renameAssetSchema = z.object({
  name: z.string().trim().min(1).max(120)
});

// Normalizes Express route params before we pass them into Prisma queries.
function routeParam(value: string | string[] | undefined) {
  if (!value || Array.isArray(value)) {
    throw new HttpError(400, "Invalid route parameter");
  }

  return value;
}

// Builds the Express application so tests and the real server can share the same routes.
export function createApp(options: AppOptions = {}) {
  const app = express();
  const queue = options.queue ?? createGenerationQueue();

  // Allows the Next.js frontend to call the API with HTTP-only auth cookies.
  app.use(
    cors({
      origin: config.webOrigin,
      credentials: true
    })
  );

  // Parses JSON bodies, cookies, logs requests, and serves generated local assets.
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(morgan(isProduction ? "combined" : "dev"));
  app.use("/uploads", express.static("uploads"));

  // Lazily connects to MongoDB so generation metadata can be read and written.
  if (!options.skipMongo) {
    app.use(
      asyncHandler(async (_request, _response, next) => {
        await connectMongo();
        next();
      })
    );
  }

  // Lightweight liveness endpoint: proves the API process is running.
  app.get("/health", (_request, response) => {
    response.json({ ok: true, service: "assetforge-api" });
  });

  // Readiness endpoint: proves the API can reach PostgreSQL.
  app.get(
    "/ready",
    asyncHandler(async (_request, response) => {
      await prisma.$queryRaw`SELECT 1`;
      response.json({ ok: true });
    })
  );

  // Registers a new user, hashes their password, and sets the auth cookie.
  app.post(
    "/auth/register",
    asyncHandler(async (request, response) => {
      const input = registerSchema.parse(request.body);
      const existing = await prisma.user.findUnique({ where: { email: input.email } });

      if (existing) {
        throw new HttpError(409, "Email is already registered");
      }

      const user = await prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash: await hashPassword(input.password)
        },
        select: { id: true, name: true, email: true }
      });

      setAuthCookie(response, user);
      response.status(201).json({ user });
    })
  );

  // Logs in an existing user by checking their password and setting the auth cookie.
  app.post(
    "/auth/login",
    asyncHandler(async (request, response) => {
      const input = loginSchema.parse(request.body);
      const user = await prisma.user.findUnique({ where: { email: input.email } });

      if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
        throw new HttpError(401, "Invalid email or password");
      }

      const authUser = { id: user.id, name: user.name, email: user.email };
      setAuthCookie(response, authUser);
      response.json({ user: authUser });
    })
  );

  // Logs out the browser by clearing the HTTP-only auth cookie.
  app.post("/auth/logout", (_request, response) => {
    clearAuthCookie(response);
    response.status(204).end();
  });

  // Returns the currently authenticated account without exposing password data.
  app.get("/auth/me", requireAuth, (request, response) => {
    response.json({ user: (request as AuthenticatedRequest).user });
  });

  // Creates a queued generation record and pushes the work into BullMQ/Redis.
  app.post(
    "/generations",
    requireAuth,
    asyncHandler(async (request, response) => {
      const authRequest = request as AuthenticatedRequest;
      const input = createGenerationSchema.parse(request.body);

      const generation = await prisma.generation.create({
        data: {
          userId: authRequest.user.id,
          prompt: input.prompt,
          status: "QUEUED"
        }
      });

      await queue.add(
        "generate-asset",
        {
          generationId: generation.id,
          userId: authRequest.user.id,
          prompt: input.prompt
        },
        defaultGenerationJobOptions
      );

      response.status(202).json({ generation });
    })
  );

  // Lists the current user's recent generation requests.
  app.get(
    "/generations",
    requireAuth,
    asyncHandler(async (request, response) => {
      const authRequest = request as AuthenticatedRequest;
      const generations = await prisma.generation.findMany({
        where: { userId: authRequest.user.id },
        orderBy: { createdAt: "desc" },
        take: 30
      });

      response.json({ generations });
    })
  );

  // Returns one generation plus its flexible MongoDB metadata.
  app.get(
    "/generations/:id",
    requireAuth,
    asyncHandler(async (request, response) => {
      const authRequest = request as AuthenticatedRequest;
      const generationId = routeParam(request.params.id);
      const generation = await prisma.generation.findFirst({
        where: { id: generationId, userId: authRequest.user.id }
      });

      if (!generation) {
        throw new HttpError(404, "Generation not found");
      }

      const metadata = await GenerationMetadata.findOne({
        generationId: generation.id,
        userId: authRequest.user.id
      }).lean();

      response.json({ generation, metadata });
    })
  );

  // Lists completed assets owned by the current user.
  app.get(
    "/assets",
    requireAuth,
    asyncHandler(async (request, response) => {
      const authRequest = request as AuthenticatedRequest;
      const assets = await prisma.asset.findMany({
        where: { ownerId: authRequest.user.id },
        orderBy: { createdAt: "desc" }
      });

      response.json({ assets });
    })
  );

  // Returns one owned asset and the metadata for the generation that created it.
  app.get(
    "/assets/:id",
    requireAuth,
    asyncHandler(async (request, response) => {
      const authRequest = request as AuthenticatedRequest;
      const assetId = routeParam(request.params.id);
      const asset = await prisma.asset.findFirst({
        where: { id: assetId, ownerId: authRequest.user.id }
      });

      if (!asset) {
        throw new HttpError(404, "Asset not found");
      }

      const metadata = asset.generationId
        ? await GenerationMetadata.findOne({
            generationId: asset.generationId,
            userId: authRequest.user.id
          }).lean()
        : null;

      response.json({ asset, metadata });
    })
  );

  // Renames an owned asset while preserving the original prompt and image.
  app.patch(
    "/assets/:id",
    requireAuth,
    asyncHandler(async (request, response) => {
      const authRequest = request as AuthenticatedRequest;
      const input = renameAssetSchema.parse(request.body);
      const assetId = routeParam(request.params.id);
      const asset = await prisma.asset.findFirst({
        where: { id: assetId, ownerId: authRequest.user.id }
      });

      if (!asset) {
        throw new HttpError(404, "Asset not found");
      }

      const updated = await prisma.asset.update({
        where: { id: asset.id },
        data: { name: input.name }
      });

      response.json({ asset: updated });
    })
  );

  // Deletes an owned asset, unlinks it from its generation, and removes the local file.
  app.delete(
    "/assets/:id",
    requireAuth,
    asyncHandler(async (request, response) => {
      const authRequest = request as AuthenticatedRequest;
      const assetId = routeParam(request.params.id);
      const asset = await prisma.asset.findFirst({
        where: { id: assetId, ownerId: authRequest.user.id }
      });

      if (!asset) {
        throw new HttpError(404, "Asset not found");
      }

      await prisma.$transaction([
        prisma.generation.updateMany({
          where: { assetId: asset.id, userId: authRequest.user.id },
          data: { assetId: null }
        }),
        prisma.asset.delete({ where: { id: asset.id } })
      ]);
      await deleteAssetFile(asset.imageUrl);

      response.status(204).end();
    })
  );

  // Converts validation, expected HTTP, and unexpected errors into JSON responses.
  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    if (error instanceof z.ZodError) {
      response.status(400).json({ error: "Invalid request", details: error.flatten() });
      return;
    }

    if (error instanceof HttpError) {
      response.status(error.statusCode).json({ error: error.message });
      return;
    }

    console.error(error);
    response.status(500).json({ error: "Internal server error" });
  });

  return app;
}
