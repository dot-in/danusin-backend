import express, { Application } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import { config } from "./env.config.js";
import {
  errorHandler,
  notFoundHandler,
} from "../middlewares/error.middleware.js";
// import { logger } from "./logger.config.js";

// Import routes
import authRoutes from "../../modules/auth/auth.routes.js";
import usersRoutes from "../../modules/users/user.routes.js";
import productsRoutes from "../../modules/products/product.routes.js";
import ordersRoutes from "../../modules/orders/order.routes.js";
import notificationsRoutes from "../../modules/notifications/notification.routes.js";
import uploadRoutes from "../../modules/upload/upload.routes.js";
import dashboardRoutes from "../../modules/dashboard/dashboard.routes.js";

export const createApp = (): Application => {
  const app = express();

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: config.server.isProduction,
      crossOriginEmbedderPolicy: config.server.isProduction,
    })
  );

  // CORS
  app.use(
    cors({
      origin: config.server.isDevelopment ? "*" : [],
      credentials: true,
    })
  );

  // Body parser
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Logging
  if (config.server.isDevelopment) {
    app.use(morgan("dev"));
  }

  // Health check
  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // API Routes
  const apiPrefix = `/api/${config.server.apiVersion}`;
  app.use(`${apiPrefix}/auth`, authRoutes);
  app.use(`${apiPrefix}/users`, usersRoutes);
  app.use(`${apiPrefix}/products`, productsRoutes);
  app.use(`${apiPrefix}/orders`, ordersRoutes);
  app.use(`${apiPrefix}/notifications`, notificationsRoutes);
  app.use(`${apiPrefix}/upload`, uploadRoutes);
  app.use(`${apiPrefix}/dashboard`, dashboardRoutes);

  // Error handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
