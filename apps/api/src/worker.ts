import "dotenv/config";
import { Worker } from "bullmq";
import {
  createRedisConnection,
  generationQueueName,
} from "./queues/generation.js";
import { prisma } from "./prisma.js";
import { fakeImageUrl } from "./utils.js";

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const worker = new Worker(
  generationQueueName, // queue name
  async (job) => {
    const { assetId, ownerId, name } = job.data;

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

    await wait(3000); // Simulates slow image generation. Later, this is where a real AI image API call would go

    const completedResult = await prisma.assets.updateMany({
      where: {
        id: assetId,
        owner_id: ownerId,
      },
      data: {
        status: "COMPLETED",
        image_url: fakeImageUrl(name),
        model: "WorkerMock-v1",
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
});

async function shutdown() {
  console.log("Shutting down asset generation worker");
  await worker.close();
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
