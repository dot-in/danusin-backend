import { Router } from "express";
import { UploadController } from "./upload.controller.js";
import { authenticate } from "../../core/middlewares/auth.middleware.js";

const router = Router();
const uploadController = new UploadController();

router.post("/", authenticate, uploadController.uploadImage);
router.post("/image", authenticate, uploadController.uploadImage);

export default router;
