import { GenerationMetadata, connectMongo, prisma } from "@assetforge/db";
import type { GenerationJobData } from "@assetforge/queue";
import { generateFakeImage } from "./fakeImageProvider.js";
import { writeAssetSvg } from "./storage.js";

const model = "FakeImageGen-v1";

export async function processGenerationJob(data: GenerationJobData) {
  await connectMongo();

  const startedAt = Date.now();
  await prisma.generation.update({
    where: { id: data.generationId },
    data: { status: "PROCESSING" }
  });

  await new Promise((resolve) => setTimeout(resolve, Number(process.env.FAKE_AI_DELAY_MS ?? 1500)));

  const result = await generateFakeImage(data.prompt);
  const imageUrl = await writeAssetSvg(data.generationId, result.svg);

  const asset = await prisma.asset.create({
    data: {
      ownerId: data.userId,
      generationId: data.generationId,
      name: result.title,
      prompt: data.prompt,
      status: "COMPLETED",
      imageUrl,
      model
    }
  });

  const generation = await prisma.generation.update({
    where: { id: data.generationId },
    data: {
      status: "COMPLETED",
      assetId: asset.id,
      completedAt: new Date()
    }
  });

  await GenerationMetadata.findOneAndUpdate(
    { generationId: data.generationId },
    {
      generationId: data.generationId,
      userId: data.userId,
      provider: "fake",
      model,
      input: {
        prompt: data.prompt,
        requestedAt: new Date(startedAt).toISOString()
      },
      output: {
        assetId: asset.id,
        imageUrl,
        seed: result.seed,
        palette: result.palette
      },
      timings: {
        totalMs: Date.now() - startedAt
      },
      attempts: 1,
      logs: ["Queued by API", "Processed by worker", "Generated local SVG asset"]
    },
    { upsert: true, new: true }
  );

  return { generation, asset };
}
