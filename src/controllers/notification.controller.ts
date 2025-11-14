import { Request, Response } from "express";
import {
  listNotifications,
  markRead,
} from "../services/notification.service.js";

export async function listNotificationsController(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  const notifications = await listNotifications(req.user.id);
  res.json(notifications);
}

export async function markReadController(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  const notificationId = Number(req.params.id);
  const result = await markRead(req.user.id, notificationId);
  res.json(result);
}
