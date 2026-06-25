import { prisma } from "../../core/config/database.config.js";
import { AppError } from "../../core/middlewares/error.middleware.js";
import { ERROR_MESSAGES } from "../../shared/constants/message.constant.js";

export class NotificationService {
  async getAll(userId: number) {
    return await prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      take: 50,
    });
  }

  async getUnreadCount(userId: number): Promise<number> {
    return await prisma.notification.count({
      where: {
        user_id: userId,
        is_read: false,
      },
    });
  }

  async create(userId: number, title: string, message: string): Promise<void> {
    await prisma.notification.create({
      data: {
        user_id: userId,
        title,
        message,
      },
    });
  }

  async markAsRead(notificationId: number, userId: number): Promise<void> {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      select: { user_id: true },
    });

    if (!notification) throw new AppError(ERROR_MESSAGES.NOTIFICATION.NOT_FOUND, 404);
    if (notification.user_id !== userId) throw new AppError(ERROR_MESSAGES.NOTIFICATION.NOT_OWNER, 403);

    await prisma.notification.update({
      where: { id: notificationId },
      data: { is_read: true },
    });
  }

  async markAllAsRead(userId: number): Promise<void> {
    await prisma.notification.updateMany({
      where: {
        user_id: userId,
        is_read: false,
      },
      data: { is_read: true },
    });
  }
}
