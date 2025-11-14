import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors.js";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return next(new AppError("Missing Authorization header", 401));

  const token = authHeader.split(" ")[1];
  if (!token) return next(new AppError("Invalid token format", 401));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as {
      id: number;
      role: "buyer" | "seller";
    };
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch {
    next(new AppError("Token invalid or expired", 401));
  }
}
