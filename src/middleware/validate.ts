import { ZodObject, ZodError } from "zod";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors.js";

function formatZodError(err: ZodError) {
  return err.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
}

export function validateBody(schema: ZodObject) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return next(new AppError(JSON.stringify(formatZodError(err)), 400));
      }
      next(err);
    }
  };
}

export function validateQuery(schema: ZodObject) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      (req as any).query = schema.parse(req.query);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return next(new AppError(JSON.stringify(formatZodError(err)), 400));
      }
      next(err);
    }
  };
}

export function validateParams(schema: ZodObject) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      (req as any).params = schema.parse(req.params);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return next(new AppError(JSON.stringify(formatZodError(err)), 400));
      }
      next(err);
    }
  };
}
