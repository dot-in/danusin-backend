import { Router } from "express";
import { ImageController } from "./image.controller.js";
import { authenticate } from "../../core/middlewares/auth.middleware.js";

const router = Router();
const imageController = new ImageController();

// Public routes
router.get("/", imageController.getByEntity. bind(imageController));
router.get("/:id", imageController.getById.bind(imageController));

// Protected routes
router.post("/", authenticate, imageController.create.bind(imageController));
router.post("/bulk", authenticate, imageController.bulkCreate.bind(imageController));
router.put("/:id", authenticate, imageController.update.bind(imageController));
router.patch("/:id/primary", authenticate, imageController.setPrimary.bind(imageController));
router.delete("/:id", authenticate, imageController.delete.bind(imageController));
router.post("/reorder", authenticate, imageController.reorder.bind(imageController));

export default router;
