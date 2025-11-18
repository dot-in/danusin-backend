// import { ResultSetHeader } from "mysql2";
import { pool } from "../../core/config/database.config.js";
import { AppError } from "../../core/middlewares/error.middleware.js";
import { NotificationRow } from "../../shared/types/database.types.js";
import { Notification } from "../../shared/types/common.types.js";
import { ERROR_MESSAGES } from "../../shared/constants/message.constant.js";

export class NotificationService {
  async getAll(userId: number): Promise<Notification[]> {
    const [notifications] = await pool.query<NotificationRow[]>(
      `SELECT * FROM notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [userId]
    );

    return notifications;
  }

  async markAsRead(notificationId: number, userId: number): Promise<void> {
    const [notifications] = await pool.query<NotificationRow[]>(
      "SELECT user_id FROM notifications WHERE id = ?",
      [notificationId]
    );

    if (notifications.length === 0) {
      throw new AppError(ERROR_MESSAGES.NOTIFICATION.NOT_FOUND, 404);
    }

    if (notifications[0].user_id !== userId) {
      throw new AppError(ERROR_MESSAGES.NOTIFICATION.NOT_OWNER, 403);
    }

    await pool.query("UPDATE notifications SET is_read = TRUE WHERE id = ?", [
      notificationId,
    ]);
  }

  async markAllAsRead(userId: number): Promise<void> {
    await pool.query(
      "UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE",
      [userId]
    );
  }
}
