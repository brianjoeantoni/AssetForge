import { promises as fs } from "node:fs";
import path from "node:path";

export function resolveUploadPath(imageUrl: string) {
  const relativePath = imageUrl.replace(/^\/uploads\//, "");
  return path.resolve(process.cwd(), "uploads", relativePath);
}

export async function deleteAssetFile(imageUrl: string) {
  if (!imageUrl.startsWith("/uploads/")) {
    return;
  }

  try {
    await fs.unlink(resolveUploadPath(imageUrl));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}
