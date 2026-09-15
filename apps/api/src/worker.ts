import "dotenv/config";
import { Worker } from "bullmq";
import {
  createRedisConnection,
  generationQueueName,
} from "./queues/generation.js";
import { prisma } from "./prisma.js";
import { getImageProvider } from "./providers/index.js";
import { connectMongo, disconnectMongo } from "./mongo.js";
import { GenerationMetadata } from "./models/generation-metadata.js";

await connectMongo();
const imageProvider = getImageProvider();

function metadataFromError(error: Error) {
  if ("provider" in error || "httpStatus" in error || "contentType" in error) {
    return {
      error: error.message,
      provider: "provider" in error ? error.provider : undefined,
      model: "model" in error ? error.model : undefined,
      httpStatus: "httpStatus" in error ? error.httpStatus : undefined,
      contentType: "contentType" in error ? error.contentType : undefined,
      errors: "errors" in error ? error.errors : undefined,
      messages: "messages" in error ? error.messages : undefined,
    };
  }

  return {
    error: error.message,
  };
}

const worker = new Worker(
  generationQueueName, // queue name
  async (job) => {
    const { assetId, ownerId, prompt, name } = job.data;

    console.log(`Processing asset generation job ${job.id}`);

    const processingResult = await prisma.assets.updateMany({
      where: {
        id: assetId,
        owner_id: ownerId,
      },
      data: {
        status: "PROCESSING",
        updated_at: new Date(),
      },
    });

    if (processingResult.count === 0) {
      console.log(`Skipping deleted asset ${assetId}`);
      return {
        assetId,
        status: "SKIPPED",
      };
    }

    // Store flexible generation execution details in MongoDB
    await GenerationMetadata.create({
      assetId,
      ownerId,
      prompt,
      status: "PROCESSING",
      provider: imageProvider.provider,
      model: imageProvider.model,
      parameters: imageProvider.parameters,
      timings: {
        queuedAt: new Date(job.timestamp),
        processingStartedAt: new Date(),
      },
    });

    const generatedImage = await imageProvider.generate({
      assetId,
      ownerId,
      prompt,
      name,
    });

    const completedResult = await prisma.assets.updateMany({
      where: {
        id: assetId,
        owner_id: ownerId,
      },
      data: {
        status: "COMPLETED",
        image_url: generatedImage.imageUrl,
        model: generatedImage.model,
        updated_at: new Date(),
      },
    });

    if (completedResult.count === 0) {
      console.log(`Skipping deleted asset ${assetId}`);
      return {
        assetId,
        status: "SKIPPED",
      };
    }
    await GenerationMetadata.updateOne(
      {
        assetId,
        ownerId,
      },
      {
        $set: {
          status: "COMPLETED",
          provider: generatedImage.provider,
          model: generatedImage.model,
          parameters: generatedImage.parameters,
          "timings.completedAt": new Date(),
          rawResponse: generatedImage.rawResponse,
        },
      },
    );

    return {
      assetId,
      status: "COMPLETED",
    };
  },
  {
    connection: createRedisConnection(),
    concurrency: 2,
  },
);

worker.on("completed", (job) => {
  console.log(`Completed asset generation job ${job.id}`);
});

worker.on("failed", async (job, error) => {
  console.error(`Failed asset generation job ${job?.id ?? "unknown"}`, error);

  const attemptsMade = job?.attemptsMade ?? 0;
  const maxAttempts = job?.opts.attempts ?? 1;

  if (attemptsMade < maxAttempts) {
    return;
  }

  const assetId = job?.data.assetId;
  const ownerId = job?.data.ownerId;

  if (!assetId || !ownerId) {
    return;
  }

  await prisma.assets.updateMany({
    where: {
      id: assetId,
      owner_id: ownerId,
    },
    data: {
      status: "FAILED",
      updated_at: new Date(),
    },
  });

  await GenerationMetadata.updateOne(
    {
      assetId,
      ownerId,
    },
    {
      $set: {
        status: "FAILED",
        "timings.failedAt": new Date(),
        rawResponse: metadataFromError(error),
      },
    },
  );
});

async function shutdown() {
  console.log("Shutting down asset generation worker");
  await worker.close();
  await disconnectMongo();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown();
});

process.on("SIGTERM", () => {
  void shutdown();
});

console.log("AssetForge worker listening for generation jobs");
