import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors.js";

export function requireRole(role: "buyer" | "seller") {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError("Unauthorized", 401));
    if (req.user.role !== role)
      return next(new AppError("Forbidden: Wrong role", 403));
    next();
  };
}
