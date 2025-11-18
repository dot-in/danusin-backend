import mysql from "mysql2/promise";
import { config } from "./env.config.js";
import { logger } from "./logger.config";

export const pool = mysql.createPool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.name,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  maxIdle: 10,
  idleTimeout: 60000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  timezone: "+00:00",
});

export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    return true;
  } catch (error) {
    logger.error({ error }, "Database connection failed");
    return false;
  }
};

export const closePool = async (): Promise<void> => {
  try {
    await pool.end();
    logger.info("Database connection pool closed");
  } catch (error) {
    logger.error({ error }, "Error closing database connection pool");
  }
};
