import type { Request, Response, NextFunction } from "express";
import { UserService } from "./user.service.js";
import { successResponse } from "../../shared/utils/response.util.js";

export class UsersController {
  private usersService:  UserService;

  constructor() {
    this.usersService = new UserService();
  }

  getPublicProfile = async (
    req: Request,
    res: Response,
    next:  NextFunction
  ): Promise<void> => {
    try {
      const userId = Number. parseInt(req.params.id);
      const profile = await this.usersService.getPublicProfile(userId);
      successResponse(res, 200, "Profil publik berhasil diambil", profile);
    } catch (error) {
      next(error);
    }
  };

  getMyProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const profile = await this.usersService. getMyProfile(userId);
      successResponse(res, 200, "Profil berhasil diambil", profile);
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      // Map 'phone' from request body to 'whatsapp' for the service
      const { phone, ...rest } = req.body;
      const profileData = {
        ...rest,
        ...(phone && { whatsapp: phone }),
      };
      const profile = await this.usersService.updateProfile(userId, profileData);
      successResponse(res, 200, "Profil berhasil diperbarui", profile);
    } catch (error) {
      next(error);
    }
  };

  updateProfileImage = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { imageUrl } = req.body;
      const profile = await this.usersService.updateProfileImage(userId, imageUrl);
      successResponse(res, 200, "Foto profil berhasil diperbarui", profile);
    } catch (error) {
      next(error);
    }
  };

  updateEmail = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { email, password } = req. body;
      const result = await this. usersService.updateEmail(userId, email, password);
      successResponse(res, 200, result.message, null);
    } catch (error) {
      next(error);
    }
  };

  updatePhone = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { phone } = req.body;
      const result = await this.usersService.updatePhone(userId, phone);
      successResponse(res, 200, result. message, null);
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { currentPassword, newPassword } = req.body;
      const result = await this.usersService.changePassword(userId, currentPassword, newPassword);
      successResponse(res, 200, result.message, null);
    } catch (error) {
      next(error);
    }
  };

  getUserOrders = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const page = Number.parseInt(req.query.page as string) || 1;
      const limit = Number.parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string | undefined;

      const result = await this.usersService.getUserOrders(userId, { page, limit, status });
      successResponse(res, 200, "Pesanan berhasil diambil", result);
    } catch (error) {
      next(error);
    }
  };

  createStore = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const result = await this.usersService.createStore(userId, req.body);
      successResponse(res, 201, result.message, { id: result.id });
    } catch (error) {
      next(error);
    }
  };

  getMyStore = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const store = await this.usersService.getMyStore(userId);
      successResponse(res, 200, "Data toko berhasil diambil", store);
    } catch (error) {
      next(error);
    }
  };
}
