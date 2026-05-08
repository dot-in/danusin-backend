import { createApp } from "./core/config/app.config.js";
import { config } from "./core/config/env.config.js";
import { testConnection, closePool } from "./core/config/database.config.js";
import { logger } from "./core/config/logger.config.js";

const startServer = async () => {
  try {
    if (!(await testConnection())) {
      logger.error("Failed to connect to database. Exiting...");
      process.exit(1);
    }

    const app = createApp();
    const server = app.listen(config.server.port, () => {
      logger.info(`
🚀 Server is running!
📡 Environment: ${config.server.nodeEnv}
🌐 URL: http://localhost:${config.server.port}
📚 API: http://localhost:${config.server.port}/api/${config.server.apiVersion}
🏥 Health: http://localhost:${config.server.port}/health
      `);
    });

    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
      server.close(async () => {
        await closePool();
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("uncaughtException", (error) => {
      logger.error({ error }, "Uncaught Exception");
      process.exit(1);
    });
    process.on("unhandledRejection", (reason) => {
      logger.error({ reason }, "Unhandled Rejection");
      process.exit(1);
    });
  } catch (error) {
    logger.error({ error }, "Failed to start server");
    process.exit(1);
  }
};

startServer();
