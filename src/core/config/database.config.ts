import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { logger } from "./logger.config.js";
import { config } from "./env.config.js";

const adapter = new PrismaMariaDb({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.name,
  connectionLimit: 10,
});

export const prisma = new PrismaClient({
  // @ts-ignore
  adapter,
  log: [
    { emit: "event", level: "query" },
    { emit: "event", level: "error" },
    { emit: "event", level: "info" },
    { emit: "event", level: "warn" },
  ],
});

// @ts-ignore
prisma.$on("query", (e: any) => {
  logger.debug({ query: e.query, params: e.params, duration: e.duration }, "Prisma Query");
});

// @ts-ignore
prisma.$on("error", (e: any) => {
  logger.error({ error: e.message }, "Prisma Error");
});

export const testConnection = async () => {
  try {
    await prisma.$connect();
    logger.info("Database connected successfully via Prisma (MariaDB Adapter - Direct Config)");
    return true;
  } catch (error) {
    logger.error({ error }, "Database connection failed");
    return false;
  }
};

export const closePool = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info("Database connection closed");
  } catch (error) {
    logger.error({ error }, "Error closing database connection");
  }
};
