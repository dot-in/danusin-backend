import pool from "../config/db.js";
import { AppError } from "../utils/errors.js";

interface CreateNotificationInput {
  title: string;
  message: string;
}

export async function createNotification(
  userId: number,
  { title, message }: CreateNotificationInput
) {
  await pool.query(
    "INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)",
    [userId, title, message]
  );
}

export async function listNotifications(userId: number) {
  const [rows] = await pool.query(
    "SELECT id, title, message, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC",
    [userId]
  );
  return rows;
}

export async function markRead(
  userId: number,
  notificationId: number | string
) {
  const [rows] = await pool.query(
    "SELECT user_id FROM notifications WHERE id=?",
    [notificationId]
  );
  const arr = rows as any[];
  if (!arr.length) throw new AppError("Notifikasi tidak ditemukan", 404);
  if (arr[0].user_id !== userId)
    throw new AppError("Tidak boleh mengubah notifikasi orang lain", 403);
  await pool.query("UPDATE notifications SET is_read=1 WHERE id=?", [
    notificationId,
  ]);
  return { message: "Notifikasi ditandai dibaca" };
}
