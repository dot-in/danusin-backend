import { Request, Response, NextFunction } from "express";
import { UploadService } from "./upload.service.js";
import { successResponse } from "../../shared/utils/response.util.js";
import { SUCCESS_MESSAGES } from "../../shared/constants/message.constant.js";
import { AppError } from "../../core/middlewares/error.middleware.js";
import { ERROR_MESSAGES } from "../../shared/constants/message.constant.js";

export class UploadController {
  private uploadService: UploadService;

  constructor() {
    this.uploadService = new UploadService();
  }

  uploadImage = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const file = (req as any).files?.image;

      if (!file) {
        throw new AppError(ERROR_MESSAGES.UPLOAD.NO_FILE, 400);
      }

      const imageUrl = await this.uploadService.uploadImage(file);
      successResponse(res, 200, SUCCESS_MESSAGES.UPLOAD.SUCCESS, {
        image_url: imageUrl,
      });
    } catch (error) {
      next(error);
    }
  };
}
