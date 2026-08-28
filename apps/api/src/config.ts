export const config = {
  port: Number(process.env.API_PORT ?? 4000),
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me",
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  mongoUrl: process.env.MONGO_URL ?? "mongodb://localhost:27017/assetforge",
  authCookieName: "assetforge_token",
};
