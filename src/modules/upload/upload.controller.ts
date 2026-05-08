import type { Request, Response, NextFunction } from "express";
import type { FileArray } from "express-fileupload";
import { UploadService } from "./upload.service.js";
import { successResponse } from "../../shared/utils/response.util.js";
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from "../../shared/constants/message.constant.js";
import { AppError } from "../../core/middlewares/error.middleware.js";

export class UploadController {
  private uploadService = new UploadService();

  uploadImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as FileArray | null | undefined;
      if (!files || !files.image) throw new AppError(ERROR_MESSAGES.UPLOAD.NO_FILE, 400);

      const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;
      const imageUrl = await this.uploadService.uploadImage({
        name: imageFile.name,
        data: imageFile.data,
        size: imageFile.size,
        mimetype: imageFile.mimetype,
      });

      successResponse(res, 200, SUCCESS_MESSAGES.UPLOAD.SUCCESS, { image_url: imageUrl });
    } catch (error) {
      next(error);
    }
  };
}
