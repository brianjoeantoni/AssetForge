import { config } from "../config.js";
import type { ImageProvider } from "./image-provider.js";
import { cloudflareImageProvider } from "./cloudflare-image-provider.js";
import { mockImageProvider } from "./mock-image-provider.js";

export function getImageProvider(): ImageProvider {
  if (config.imageProvider === "cloudflare") {
    return cloudflareImageProvider;
  }

  if (config.imageProvider === "mock") {
    return mockImageProvider;
  }

  throw new Error(`Unknown image provider: ${config.imageProvider}`);
}