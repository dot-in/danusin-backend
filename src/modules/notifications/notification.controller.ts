import { Request, Response, NextFunction } from "express";
import { NotificationService } from "./notification.service.js";
import { successResponse } from "../../shared/utils/response.util.js";
import { SUCCESS_MESSAGES } from "../../shared/constants/message.constant.js";

export class NotificationsController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  getAll = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const notifications = await this.notificationService.getAll(req.user!.id);
      successResponse(res, 200, "Notifikasi berhasil diambil", notifications);
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const notificationId = parseInt(req.params.id);
      await this.notificationService.markAsRead(notificationId, req.user!.id);
      successResponse(res, 200, SUCCESS_MESSAGES.NOTIFICATION.MARKED_READ);
    } catch (error) {
      next(error);
    }
  };

  markAllAsRead = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await this.notificationService.markAllAsRead(req.user!.id);
      successResponse(res, 200, SUCCESS_MESSAGES.NOTIFICATION.ALL_MARKED_READ);
    } catch (error) {
      next(error);
    }
  };
}
