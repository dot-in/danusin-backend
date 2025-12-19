import { Router } from "express";
import { UploadController } from "./upload.controller.js";
import { authenticate } from "../../core/middlewares/auth.middleware.js";

const router = Router();
const uploadController = new UploadController();

// Upload image - accessible by all authenticated users
// Used for student proof upload when creating store
router.post("/", authenticate, uploadController.uploadImage);

// Upload image with /image path - for backwards compatibility
// Only accessible by sellers (for product images, etc.)
router.post(
  "/image",
  authenticate,
  uploadController.uploadImage
);

export default router;
