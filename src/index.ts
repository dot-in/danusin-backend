import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";

import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import orderRoutes from "./routes/order.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import { AppError } from "./utils/errors.js";

dotenv.config();

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (_req, res) => {
  res.json({ message: "Danus.in API (Express 5, TS, Zod) OK" });
});

app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/orders", orderRoutes);
app.use("/notifications", notificationRoutes);

app.use((req, _res, next) => {
  next(
    new AppError(`Route ${req.method} ${req.originalUrl} tidak ditemukan`, 404)
  );
});

app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    const status = err.status || 500;
    let message = err.message || "Internal Server Error";
    try {
      if (message.startsWith("[") || message.startsWith("{")) {
        const parsed = JSON.parse(message);
        return res.status(status).json({ errors: parsed });
      }
    } catch {}
    res.status(status).json({ message });
  }
);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
