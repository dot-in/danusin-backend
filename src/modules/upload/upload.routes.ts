import { Router } from "express";
import { UploadController } from "./upload.controller.js";
import {
  authenticate,
  authorize,
} from "../../core/middlewares/auth.middleware.js";

const router = Router();
const uploadController = new UploadController();

router.post(
  "/image",
  authenticate,
  authorize("seller"),
  uploadController.uploadImage
);

export default router;
