import { Router } from "express";
import {
  listNotificationsController,
  markReadController,
} from "../controllers/notification.controller.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

router.get("/", authMiddleware, listNotificationsController);
router.patch("/:id/read", authMiddleware, markReadController);

export default router;
