import type { Request, Response, NextFunction } from "express";
import { ReviewService } from "./review.service.js";
import { successResponse } from "../../shared/utils/response.util.js";
import { AppError } from "../../core/middlewares/error.middleware.js";

export class ReviewController {
  private reviewService = new ReviewService();

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401);
      const review = await this.reviewService.create(req.user.id, req.body);
      successResponse(res, 201, "Ulasan berhasil dikirim", { review });
    } catch (error) {
      next(error);
    }
  };

  getProductReviews = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const productId = Number.parseInt(req.params.id as string);
      const reviews = await this.reviewService.getByProductId(productId);
      const summary = await this.reviewService.getProductRatingSummary(productId);
      successResponse(res, 200, "Ulasan produk berhasil diambil", { reviews, summary });
    } catch (error) {
      next(error);
    }
  };
}
