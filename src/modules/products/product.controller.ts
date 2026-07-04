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

      let days: string[] | undefined = undefined;
      if (typeof req.query.days === "string" && req.query.days.trim()) {
        days = req.query.days.split(",").map(d => d.trim());
      } else if (Array.isArray(req.query.days)) {
        days = req.query.days.map(d => String(d).trim());
      }

      let locations: string[] | undefined = undefined;
      if (typeof req.query.locations === "string" && req.query.locations.trim()) {
        locations = req.query.locations.split(",").map(l => l.trim());
      } else if (Array.isArray(req.query.locations)) {
        locations = req.query.locations.map(l => String(l).trim());
      }

      const query = {
        q: req.query.q as string,
        min_price: req.query.min_price ? Number.parseInt(req.query.min_price as string) : undefined,
        max_price: req.query.max_price ? Number.parseInt(req.query.max_price as string) : undefined,
        open_only: req.query.open_only === "true",
        seller_id: req.query.seller_id ? Number.parseInt(req.query.seller_id as string) : undefined,
        exclude_seller_id: req.query.exclude_seller_id ? Number.parseInt(req.query.exclude_seller_id as string) : undefined,
        days,
        locations,
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
      const product = await this.productService.getById(Number.parseInt(req.params.id as string));
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
      const product = await this.productService.update(Number.parseInt(req.params.id as string), req.user.id, req.body);
      successResponse(res, 200, SUCCESS_MESSAGES.PRODUCT.UPDATED, { product });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401);
      await this.productService.delete(Number.parseInt(req.params.id as string), req.user.id);
      successResponse(res, 200, SUCCESS_MESSAGES.PRODUCT.DELETED);
    } catch (error) {
      next(error);
    }
  };

  getStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401);
      const data = await this.productService.getProductStats(
        Number.parseInt(req.params.id as string),
        req.user.id
      );
      successResponse(res, 200, "Statistik produk berhasil diambil", data);
    } catch (error) {
      next(error);
    }
  };
}
