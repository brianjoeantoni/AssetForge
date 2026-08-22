import "dotenv/config";
import cors from "cors";
import express from "express";

const app = express();
const port = Number(process.env.API_PORT ?? 4000);

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "assetforge-api",
  });
});

app.listen(port, () => {
  console.log(`AssetForge API running on http://localhost:${port}`);
});
