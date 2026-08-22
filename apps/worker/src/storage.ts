import { promises as fs } from "node:fs";
import path from "node:path";

export function getAssetOutputDirectory() {
  return path.resolve(process.env.ASSET_UPLOAD_DIR || path.join(process.cwd(), "../api/uploads/assets"));
}

export async function writeAssetSvg(generationId: string, svg: string) {
  const outputDirectory = getAssetOutputDirectory();
  await fs.mkdir(outputDirectory, { recursive: true });

  const fileName = `${generationId}.svg`;
  const outputPath = path.join(outputDirectory, fileName);
  await fs.writeFile(outputPath, svg, "utf8");

  return `/uploads/assets/${fileName}`;
}
