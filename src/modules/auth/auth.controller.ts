import type { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service.js";
import { successResponse } from "../../shared/utils/response.util.js";
import { SUCCESS_MESSAGES } from "../../shared/constants/message.constant.js";
import { AppError } from "../../core/middlewares/error.middleware.js";

export class AuthController {
  private authService = new AuthService();

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.authService.register(req.body);
      successResponse(res, 201, SUCCESS_MESSAGES.AUTH.REGISTER_SUCCESS, { user });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { credential, password } = req.body;
      const result = await this.authService.login(credential, password);
      successResponse(res, 200, SUCCESS_MESSAGES.AUTH.LOGIN_SUCCESS, result);
    } catch (error) {
      next(error);
    }
  };

  getMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401);
      const user = await this.authService.getProfile(req.user.id);
      successResponse(res, 200, "Profil berhasil diambil", user);
    } catch (error) {
      next(error);
    }
  };

  updateMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401);
      const user = await this.authService.updateProfile(req.user.id, req.body);
      successResponse(res, 200, SUCCESS_MESSAGES.AUTH.PROFILE_UPDATED, { user });
    } catch (error) {
      next(error);
    }
  };

  upgradeSeller = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401);
      const user = await this.authService.upgradeSeller(req.user.id, req.body.whatsapp);
      successResponse(res, 200, SUCCESS_MESSAGES.AUTH.UPGRADE_SUCCESS, { user });
    } catch (error) {
      next(error);
    }
  };
}
