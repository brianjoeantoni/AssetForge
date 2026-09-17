function requiredInProduction(name: string, value?: string) {
  if (process.env.NODE_ENV === "production" && !value?.trim()) {
    throw new Error(`${name} must be set when NODE_ENV=production`);
  }

  return value;
}

const nodeEnv = process.env.NODE_ENV ?? "development";

export const config = {
  nodeEnv,
  isProduction: nodeEnv === "production",
  port: Number(process.env.API_PORT ?? 4000),
  webOrigin:
    requiredInProduction("WEB_ORIGIN", process.env.WEB_ORIGIN) ??
    "http://localhost:3000",
  jwtSecret:
    requiredInProduction("JWT_SECRET", process.env.JWT_SECRET) ??
    "dev-secret-change-me",
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  mongoUrl: process.env.MONGO_URL ?? "mongodb://localhost:27017/assetforge",
  authCookieName: "assetforge_token",

  imageProvider: process.env.IMAGE_PROVIDER ?? "mock",
  cloudflareAccountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  cloudflareApiToken: process.env.CLOUDFLARE_API_TOKEN,
  cloudflareImageModel:
    process.env.CLOUDFLARE_IMAGE_MODEL ??
    "@cf/bytedance/stable-diffusion-xl-lightning",
};