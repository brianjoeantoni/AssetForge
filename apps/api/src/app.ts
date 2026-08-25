import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import { config } from "./config.js";
import { assetsRouter } from "./routes/assets.js";
import { authRouter } from "./routes/auth.js";
import { healthRouter } from "./routes/health.js";
import { usersRouter } from "./routes/users.js";

export const app = express();

app.use(
  cors({
    origin: config.webOrigin,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use(healthRouter);
app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/assets", assetsRouter);
