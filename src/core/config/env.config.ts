import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().default("3000"),
  API_VERSION: z.string().default("v1"),
  DATABASE_HOST: z.string(),
  DATABASE_PORT: z.string().default("3306"),
  DATABASE_USER: z.string(),
  DATABASE_PASSWORD: z.string().default(""),
  DATABASE_NAME: z.string(),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  UPLOAD_DIR: z.string().default("./uploads"),
  MAX_FILE_SIZE: z.string().default("5242880"),
  ALLOWED_EXTENSIONS: z.string().default("jpg,jpeg,png,webp"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
});

const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error("❌ Invalid environment variables:");
    if (error instanceof z.ZodError) {
      for (const err of error.issues) {
        console.error(`  - ${err.path.join(".")}: ${err.message}`);
      }
    }
    process.exit(1);
  }
};

export const env = parseEnv();

export const config = {
  server: {
    nodeEnv: env.NODE_ENV,
    port: parseInt(env.PORT, 10),
    apiVersion: env.API_VERSION,
    isDevelopment: env.NODE_ENV === "development",
    isProduction: env.NODE_ENV === "production",
  },
  database: {
    host: env.DATABASE_HOST,
    port: parseInt(env.DATABASE_PORT, 10),
    user: env.DATABASE_USER,
    password: env.DATABASE_PASSWORD,
    name: env.DATABASE_NAME,
  },
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },
  upload: {
    dir: env.UPLOAD_DIR,
    maxSize: parseInt(env.MAX_FILE_SIZE, 10),
    allowedExtensions: env.ALLOWED_EXTENSIONS.split(","),
  },
  logging: {
    level: env.LOG_LEVEL,
  },
} as const;
