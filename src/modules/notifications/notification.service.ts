import { pool } from "../../core/config/database.config.js";
import { AppError } from "../../core/middlewares/error.middleware.js";
import { NotificationRow } from "../../shared/types/database.types.js";
import { Notification } from "../../shared/types/common.types.js";
import { ERROR_MESSAGES } from "../../shared/constants/message.constant.js";

export class NotificationService {
  async getAll(userId: number): Promise<Notification[]> {
    const [rows] = await pool.query<NotificationRow[]>(
      "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
      [userId]
    );
    return rows;
  }

  async getUnreadCount(userId: number): Promise<number> {
    const [rows] = await pool.query<any[]>(
      "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE",
      [userId]
    );
    return rows[0].count;
  }

  async create(userId: number, title: string, message: string): Promise<void> {
    await pool.query("INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)", [userId, title, message]);
  }

  async markAsRead(notificationId: number, userId: number): Promise<void> {
    const [rows] = await pool.query<NotificationRow[]>("SELECT user_id FROM notifications WHERE id = ?", [notificationId]);
    if (rows.length === 0) throw new AppError(ERROR_MESSAGES.NOTIFICATION.NOT_FOUND, 404);
    if (rows[0].user_id !== userId) throw new AppError(ERROR_MESSAGES.NOTIFICATION.NOT_OWNER, 403);
    await pool.query("UPDATE notifications SET is_read = TRUE WHERE id = ?", [notificationId]);
  }

  async markAllAsRead(userId: number): Promise<void> {
    await pool.query("UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE", [userId]);
  }
}
