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
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
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

  app.use("/uploads", express.static(path.resolve(process.cwd(), config.upload.dir)));

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
