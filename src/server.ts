import { createApp } from "./core/config/app.config.js";
import { config } from "./core/config/env.config.js";
import { testConnection, closePool } from "./core/config/database.config.js";
import { logger } from "./core/config/logger.config.js";

const startServer = async () => {
  try {
    // Test database connection
    const isDbConnected = await testConnection();
    if (!isDbConnected) {
      logger.error("Failed to connect to database. Exiting...");
      process.exit(1);
    }

    // Create Express app
    const app = createApp();

    // Start server
    const server = app.listen(config.server.port, () => {
      logger.info(`
🚀 Server is running!
📡 Environment: ${config.server.nodeEnv}
🌐 URL: http://localhost:${config.server.port}
📚 API: http://localhost:${config.server.port}/api/${config.server.apiVersion}
🏥 Health: http://localhost:${config.server.port}/health
      `);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info("HTTP server closed");

        await closePool();
        logger.info("Database pool closed");

        logger.info("Graceful shutdown completed");
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error("Forcing shutdown after timeout");
        process.exit(1);
      }, 10000);
    };

    // Handle signals
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // Handle uncaught errors
    process.on("uncaughtException", (error) => {
      logger.error({ error }, "Uncaught Exception");
      process.exit(1);
    });

    process.on("unhandledRejection", (reason, promise) => {
      logger.error({ reason, promise }, "Unhandled Rejection");
      process.exit(1);
    });
  } catch (error) {
    logger.error({ error }, "Failed to start server");
    process.exit(1);
  }
};

startServer();
