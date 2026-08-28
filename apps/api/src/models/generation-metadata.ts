import mongoose, { Schema } from "mongoose";

export type GenerationMetadataStatus =
  | "QUEUED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

export type GenerationMetadataDocument = {
  assetId: string;
  ownerId: string;
  prompt: string;
  status: GenerationMetadataStatus;
  provider: string;
  model: string;
  parameters: {
    width: number;
    height: number;
    style: string;
  };
  timings: {
    queuedAt: Date;
    processingStartedAt?: Date;
    completedAt?: Date;
    failedAt?: Date;
  };
  rawResponse?: {
    imageUrl?: string;
    error?: string;
  };
};

// Metadata is flexible and likely to change
const generationMetadataSchema = new Schema<GenerationMetadataDocument>(
  {
    assetId: {
      type: String,
      required: true,
      index: true,
    },
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
    prompt: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["QUEUED", "PROCESSING", "COMPLETED", "FAILED"],
    },
    provider: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      required: true,
    },
    parameters: {
      width: {
        type: Number,
        required: true,
      },
      height: {
        type: Number,
        required: true,
      },
      style: {
        type: String,
        required: true,
      },
    },
    timings: {
      queuedAt: {
        type: Date,
        required: true,
      },
      processingStartedAt: Date,
      completedAt: Date,
      failedAt: Date,
    },
    rawResponse: {
      imageUrl: String,
      error: String,
    },
  },
  {
    timestamps: true,
  },
);

export const GenerationMetadata =
  mongoose.models.GenerationMetadata ??
  mongoose.model<GenerationMetadataDocument>(
    "GenerationMetadata",
    generationMetadataSchema,
  );
