import "dotenv/config";
import { app } from "./app.js";
import { config } from "./config.js";

app.listen(config.port, () => {
  console.log(`AssetForge API running on http://localhost:${config.port}`);
});
