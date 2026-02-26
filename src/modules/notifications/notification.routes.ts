import { Router } from "express";
import { NotificationsController } from "./notification.controller.js";
import { authenticate } from "../../core/middlewares/auth.middleware.js";
import { validate } from "../../core/middlewares/validation.middleware.js";
import { markReadSchema } from "./notification.validation.js";

const router = Router();
const notificationsController = new NotificationsController();

router.get("/", authenticate, notificationsController.getAll);
router.get(
  "/unread-count",
  authenticate,
  notificationsController.getUnreadCount,
);
router.patch(
  "/:id/read",
  authenticate,
  validate(markReadSchema),
  notificationsController.markAsRead,
);
router.post("/read-all", authenticate, notificationsController.markAllAsRead);

export default router;
