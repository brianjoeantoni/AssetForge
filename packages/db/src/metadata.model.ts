import mongoose, { Schema, type InferSchemaType } from "mongoose";

const generationMetadataSchema = new Schema(
  {
    generationId: { type: String, required: true, index: true, unique: true },
    userId: { type: String, required: true, index: true },
    provider: { type: String, required: true },
    model: { type: String, required: true },
    input: { type: Schema.Types.Mixed, required: true },
    output: { type: Schema.Types.Mixed },
    timings: { type: Schema.Types.Mixed },
    attempts: { type: Number, default: 1 },
    logs: { type: [String], default: [] }
  },
  { timestamps: true, collection: "generation_metadata" }
);

export type GenerationMetadataDocument = InferSchemaType<typeof generationMetadataSchema>;

export const GenerationMetadata =
  mongoose.models.GenerationMetadata ??
  mongoose.model("GenerationMetadata", generationMetadataSchema);
