import { Request, Response, NextFunction } from "express";
import { config } from "../config/env.config.js";
import { logger } from "../config/logger.config.js";

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      message: err.message,
    });
    return;
  }

  logger.error({ err, url: req.url, method: req.method }, "Unhandled error");

  res.status(500).json({
    message: "Terjadi kesalahan pada server",
    ...(config.server.isDevelopment && {
      error: err.message,
      stack: err.stack,
    }),
  });
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(404).json({
    message: "Endpoint tidak ditemukan",
    path: req.url,
  });
};
