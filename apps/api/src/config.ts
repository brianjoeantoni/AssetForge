import "dotenv/config";

export const config = {
  port: Number(process.env.API_PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "dev-only-secret-change-me",
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
  nodeEnv: process.env.NODE_ENV ?? "development",
  cookieName: "assetforge_token"
};

export const isProduction = config.nodeEnv === "production";
