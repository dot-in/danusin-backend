import express, { type Application } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import fileUpload from "express-fileupload";
import path from "path";
import { config } from "./env.config.js";
import { errorHandler, notFoundHandler } from "../middlewares/error.middleware.js";
import authRoutes from "../../modules/auth/auth.routes.js";
import usersRoutes from "../../modules/users/user.routes.js";
import productsRoutes from "../../modules/products/product.routes.js";
import ordersRoutes from "../../modules/orders/order.routes.js";
import notificationsRoutes from "../../modules/notifications/notification.routes.js";
import uploadRoutes from "../../modules/upload/upload.routes.js";
import dashboardRoutes from "../../modules/dashboard/dashboard.routes.js";
import imageRoutes from "../../modules/images/image.routes.js";
import storesRoutes from "../../modules/stores/store.routes.js";
import reviewsRoutes from "../../modules/reviews/review.routes.js";

export const createApp = (): Application => {
  const app = express();

  app.use(helmet({
    contentSecurityPolicy: config.server.isProduction,
    crossOriginEmbedderPolicy: config.server.isProduction,
  }));

  app.use(cors({
    origin: config.server.isDevelopment ? "*" : [],
    credentials: true,
  }));

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  app.use(fileUpload({
    limits: { fileSize: config.upload.maxSize },
    abortOnLimit: true,
    createParentPath: true,
    useTempFiles: false,
  }));

  if (config.server.isDevelopment) app.use(morgan("dev"));

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  const apiPrefix = `/api/${config.server.apiVersion}`;

  app.get("/uploads/:filename", (req, res, next) => {
    const { filename } = req.params;
    const uuidFileRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-zA-Z0-9]{1,8}$/i;
    
    if (!uuidFileRegex.test(filename)) {
      return res.status(400).json({ status: "error", message: "Invalid filename" });
    }

    res.sendFile(path.resolve(config.upload.dir, filename), (err) => {
      if (err) {
        if ((err as any).code === "ENOENT") return res.status(404).json({ status: "error", message: "File not found" });
        next(err);
      }
    });
  });

  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  app.use(`${apiPrefix}/auth`, authRoutes);
  app.use(`${apiPrefix}/users`, usersRoutes);
  app.use(`${apiPrefix}/products`, productsRoutes);
  app.use(`${apiPrefix}/orders`, ordersRoutes);
  app.use(`${apiPrefix}/notifications`, notificationsRoutes);
  app.use(`${apiPrefix}/upload`, uploadRoutes);
  app.use(`${apiPrefix}/dashboard`, dashboardRoutes);
  app.use(`${apiPrefix}/images`, imageRoutes);
  app.use(`${apiPrefix}/stores`, storesRoutes);
  app.use(`${apiPrefix}/reviews`, reviewsRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
