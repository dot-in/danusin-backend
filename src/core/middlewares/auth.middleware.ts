import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../../shared/utils/jwt.util.js";
import { errorResponse } from "../../shared/utils/response.util.js";
import { AppError } from "./error.middleware.js";
import type { AuthUser } from "../../shared/types/common.types.js";

export interface AuthRequest extends Request {
  user: AuthUser;
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new AppError("Token tidak ditemukan", 401);
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    req.user = decoded as AuthUser;

    next();
  } catch (error) {
    if (error instanceof AppError) {
      errorResponse(
        res,
        (error as AppError).statusCode,
        (error as AppError).message
      );
    } else {
      errorResponse(res, 401, "Token tidak valid");
    }
  }
};

export const authorize = (...roles: Array<"buyer" | "seller">) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      errorResponse(res, 401, "Unauthorized");
      return;
    }

    if (!roles.includes(req.user.role)) {
      errorResponse(
        res,
        403,
        `Akses ditolak. Hanya untuk ${roles.join(" atau ")}`
      );
      return;
    }

    next();
  };
};
