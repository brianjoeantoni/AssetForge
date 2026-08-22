import { Queue, type JobsOptions } from "bullmq";
import { Redis } from "ioredis";

export const GENERATION_QUEUE_NAME = "asset-generations";

export type GenerationJobData = {
  generationId: string;
  userId: string;
  prompt: string;
};

export function createRedisConnection(redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379") {
  return new Redis(redisUrl, {
    maxRetriesPerRequest: null
  });
}

export function createGenerationQueue(connection = createRedisConnection()) {
  return new Queue<GenerationJobData>(GENERATION_QUEUE_NAME, { connection });
}

export const defaultGenerationJobOptions: JobsOptions = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 1000
  },
  removeOnComplete: 100,
  removeOnFail: 100
};
