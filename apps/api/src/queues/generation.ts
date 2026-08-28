import { Queue } from "bullmq";
import { Redis } from "ioredis";
import { config } from "../config.js";

export const generationQueueName = "asset-generation";

export type GenerateAssetJobData = {
  assetId: string;
  ownerId: string;
  prompt: string;
  name: string;
};

export function createRedisConnection() {
  return new Redis(config.redisUrl, {
    maxRetriesPerRequest: null,
  });
}

export const generationQueue = new Queue<GenerateAssetJobData>(
  generationQueueName,
  {
    connection: createRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
      removeOnComplete: {
        count: 100,
      },
      removeOnFail: {
        count: 100,
      },
    },
  },
);