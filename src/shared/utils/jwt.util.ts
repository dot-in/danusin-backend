import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { config } from "../../core/config/env.config.js";
import { JWTPayload } from "../types/common.types.js";
import { AppError } from "../../core/middlewares/error.middleware.js";

export const generateToken = (payload: JWTPayload): string => {
  const options: SignOptions = {
    expiresIn: config.jwt.expiresIn as unknown as SignOptions["expiresIn"],
    issuer: "danusin-backend",
    audience: "danusin-frontend",
  };

  return jwt.sign(payload, config.jwt.secret as Secret, options);
};

export const verifyToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret as Secret, {
      issuer: "danusin-backend",
      audience: "danusin-frontend",
    });
    return decoded as JWTPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError("Token telah kadaluarsa", 401);
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError("Token tidak valid", 401);
    }
    throw new AppError("Verifikasi token gagal", 401);
  }
};

export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
};
