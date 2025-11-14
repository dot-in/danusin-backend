import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import router from "./routes";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use(router);

// Not found
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.status) return res.status(err.status).json({ error: err.message });
  res.status(500).json({ error: "Internal Server Error" });
});

export default app;
