import "dotenv/config";
import { Worker } from "bullmq";
import { GENERATION_QUEUE_NAME, createRedisConnection, type GenerationJobData } from "@assetforge/queue";
import { prisma } from "@assetforge/db";
import { processGenerationJob } from "./processor.js";

const connection = createRedisConnection();

const worker = new Worker<GenerationJobData>(
  GENERATION_QUEUE_NAME,
  async (job) => {
    console.log(`Processing generation ${job.data.generationId}`);
    return processGenerationJob(job.data);
  },
  { connection, concurrency: 3 }
);

worker.on("completed", (job) => {
  console.log(`Completed generation job ${job.id}`);
});

worker.on("failed", async (job, error) => {
  console.error(`Generation job ${job?.id ?? "unknown"} failed`, error);

  if (job?.data.generationId) {
    await prisma.generation.update({
      where: { id: job.data.generationId },
      data: {
        status: "FAILED",
        error: error.message
      }
    });
  }
});

async function shutdown(signal: string) {
  console.log(`Received ${signal}, shutting down worker`);
  await worker.close();
  await connection.quit();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
