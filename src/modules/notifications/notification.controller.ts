import type { Request, Response, NextFunction } from "express";
import { NotificationService } from "./notification.service.js";
import { successResponse } from "../../shared/utils/response.util.js";
import { SUCCESS_MESSAGES } from "../../shared/constants/message.constant.js";
import { AppError } from "../../core/middlewares/error.middleware.js";

export class NotificationsController {
  private notificationService = new NotificationService();

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401);
      const notifications = await this.notificationService.getAll(req.user.id);
      successResponse(res, 200, "Notifikasi berhasil diambil", notifications);
    } catch (error) {
      next(error);
    }
  };

  getUnreadCount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401);
      const count = await this.notificationService.getUnreadCount(req.user.id);
      successResponse(res, 200, "Jumlah notifikasi belum dibaca", { count });
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401);
      await this.notificationService.markAsRead(Number.parseInt(req.params.id), req.user.id);
      successResponse(res, 200, SUCCESS_MESSAGES.NOTIFICATION.MARKED_READ);
    } catch (error) {
      next(error);
    }
  };

  markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401);
      await this.notificationService.markAllAsRead(req.user.id);
      successResponse(res, 200, SUCCESS_MESSAGES.NOTIFICATION.ALL_MARKED_READ);
    } catch (error) {
      next(error);
    }
  };
}
