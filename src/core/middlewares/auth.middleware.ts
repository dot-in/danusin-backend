import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../../shared/utils/jwt.util.js";
import { AppError } from "./error.middleware.js";

export const authenticate = async (
  req: Request,
  _: Response,
  next: NextFunction,
) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer "))
      throw new AppError("Token tidak ditemukan", 401);
    req.user = verifyToken(header.substring(7));
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles: Array<"buyer" | "seller">) => {
  return (req: Request, _: Response, next: NextFunction) => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    if (!roles.includes(req.user.role))
      throw new AppError(
        `Akses ditolak. Hanya untuk ${roles.join(" atau ")}`,
        403,
      );
    next();
  };
};
