import { Request, Response, NextFunction } from "express";
import { ProductService } from "./product.service.js";
import {
  successResponse,
  paginatedResponse,
} from "../../shared/utils/response.util.js";
import { SUCCESS_MESSAGES } from "../../shared/constants/message.constant.js";

export class ProductsController {
  private productService: ProductService;

  constructor() {
    this.productService = new ProductService();
  }

  getAll = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const query = {
        q: req.query.q as string,
        min_price: req.query.min_price
          ? parseInt(req.query.min_price as string)
          : undefined,
        max_price: req.query.max_price
          ? parseInt(req.query.max_price as string)
          : undefined,
        open_only: req.query.open_only === "true",
        seller_id: req.query.seller_id
          ? parseInt(req.query.seller_id as string)
          : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      };

      const { products, total } = await this.productService.getAll(query);
      paginatedResponse(
        res,
        200,
        "Produk berhasil diambil",
        products,
        query.page,
        query.limit,
        total
      );
    } catch (error) {
      next(error);
    }
  };

  getById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const productId = parseInt(req.params.id);
      const product = await this.productService.getById(productId);
      successResponse(res, 200, "Detail produk berhasil diambil", product);
    } catch (error) {
      next(error);
    }
  };

  getMine = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const products = await this.productService.getMySeller(req.user!.id);
      successResponse(res, 200, "Produk Anda berhasil diambil", products);
    } catch (error) {
      next(error);
    }
  };

  create = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const product = await this.productService.create(req.user!.id, req.body);
      successResponse(res, 201, SUCCESS_MESSAGES.PRODUCT.CREATED, { product });
    } catch (error) {
      next(error);
    }
  };

  update = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const productId = parseInt(req.params.id);
      const product = await this.productService.update(
        productId,
        req.user!.id,
        req.body
      );
      successResponse(res, 200, SUCCESS_MESSAGES.PRODUCT.UPDATED, { product });
    } catch (error) {
      next(error);
    }
  };

  delete = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const productId = parseInt(req.params.id);
      await this.productService.delete(productId, req.user!.id);
      successResponse(res, 200, SUCCESS_MESSAGES.PRODUCT.DELETED);
    } catch (error) {
      next(error);
    }
  };
}
