import type { Request, Response, NextFunction } from "express";
import { UserService } from "./user.service.js";
import { successResponse } from "../../shared/utils/response.util.js";
import { AppError } from "../../core/middlewares/error.middleware.js";

export class UsersController {
  private usersService = new UserService();

  getPublicProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await this.usersService.getPublicProfile(Number.parseInt(req.params.id));
      successResponse(res, 200, "Profil publik berhasil diambil", profile);
    } catch (error) {
      next(error);
    }
  };

  getMyProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401);
      const profile = await this.usersService.getMyProfile(req.user.id);
      successResponse(res, 200, "Profil berhasil diambil", profile);
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401);
      const { phone, ...rest } = req.body;
      const profile = await this.usersService.updateProfile(req.user.id, { ...rest, ...(phone && { whatsapp: phone }) });
      successResponse(res, 200, "Profil berhasil diperbarui", profile);
    } catch (error) {
      next(error);
    }
  };

  updateProfileImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401);
      const profile = await this.usersService.updateProfileImage(req.user.id, req.body.imageUrl);
      successResponse(res, 200, "Foto profil berhasil diperbarui", profile);
    } catch (error) {
      next(error);
    }
  };

  updateEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401);
      const { email, password } = req.body;
      const result = await this.usersService.updateEmail(req.user.id, email, password);
      successResponse(res, 200, result.message, null);
    } catch (error) {
      next(error);
    }
  };

  updatePhone = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401);
      const result = await this.usersService.updatePhone(req.user.id, req.body.phone);
      successResponse(res, 200, result.message, null);
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401);
      const { currentPassword, newPassword } = req.body;
      const result = await this.usersService.changePassword(req.user.id, {
        current_password: currentPassword,
        new_password: newPassword,
      });
      successResponse(res, 200, result.message, null);
    } catch (error) {
      next(error);
    }
  };

  getUserOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401);
      const page = Number.parseInt(req.query.page as string) || 1;
      const limit = Number.parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string | undefined;
      const result = await this.usersService.getUserOrders(req.user.id, { page, limit, status });
      successResponse(res, 200, "Pesanan berhasil diambil", result);
    } catch (error) {
      next(error);
    }
  };

  createStore = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401);
      const result = await this.usersService.createStore(req.user.id, req.body);
      successResponse(res, 201, result.message, { id: result.id, token: result.token });
    } catch (error) {
      next(error);
    }
  };

  getMyStore = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401);
      const store = await this.usersService.getMyStore(req.user.id);
      successResponse(res, 200, "Data toko berhasil diambil", store);
    } catch (error) {
      next(error);
    }
  };
}
