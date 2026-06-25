import type { Request, Response, NextFunction } from "express";
import { ProductService } from "./product.service.js";
import {
  successResponse,
  paginatedResponse,
} from "../../shared/utils/response.util.js";
import { SUCCESS_MESSAGES } from "../../shared/constants/message.constant.js";
import { AppError } from "../../core/middlewares/error.middleware.js";

export class ProductsController {
  private productService = new ProductService();

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Number.parseInt(req.query.page as string) || 1;
      const limit = Number.parseInt(req.query.limit as string) || 20;
      const query = {
        q: req.query.q as string,
        min_price: req.query.min_price ? Number.parseInt(req.query.min_price as string) : undefined,
        max_price: req.query.max_price ? Number.parseInt(req.query.max_price as string) : undefined,
        open_only: req.query.open_only === "true",
        seller_id: req.query.seller_id ? Number.parseInt(req.query.seller_id as string) : undefined,
        page,
        limit,
      };

      const { products, total } = await this.productService.getAll(query);
      paginatedResponse(res, 200, "Produk berhasil diambil", products, page, limit, total);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await this.productService.getById(Number.parseInt(req.params.id));
      successResponse(res, 200, "Detail produk berhasil diambil", product);
    } catch (error) {
      next(error);
    }
  };

  getMine = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401);
      const products = await this.productService.getMySeller(req.user.id);
      successResponse(res, 200, "Produk Anda berhasil diambil", products);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401);
      const product = await this.productService.create(req.user.id, req.body);
      successResponse(res, 201, SUCCESS_MESSAGES.PRODUCT.CREATED, { product });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401);
      const product = await this.productService.update(Number.parseInt(req.params.id), req.user.id, req.body);
      successResponse(res, 200, SUCCESS_MESSAGES.PRODUCT.UPDATED, { product });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401);
      await this.productService.delete(Number.parseInt(req.params.id), req.user.id);
      successResponse(res, 200, SUCCESS_MESSAGES.PRODUCT.DELETED);
    } catch (error) {
      next(error);
    }
  };
}
