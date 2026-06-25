import type { Request, Response, NextFunction } from "express";
import { StoreService } from "./store.service.js";
import { successResponse } from "../../shared/utils/response.util.js";
import { AppError } from "../../core/middlewares/error.middleware.js";

export class StoreController {
  private storeService = new StoreService();

  getMyStore = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401);
      const store = await this.storeService.getMyStore(req.user.id);
      if (!store) throw new AppError("Anda belum memiliki toko", 404);
      successResponse(res, 200, "Data toko berhasil diambil", store);
    } catch (error) {
      next(error);
    }
  };

  createStore = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401);
      const result = await this.storeService.createStore(req.user.id, req.body);
      successResponse(res, 201, result.message, result);
    } catch (error) {
      next(error);
    }
  };

  updateStore = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401);
      const store = await this.storeService.updateStore(req.user.id, req.body);
      successResponse(res, 200, "Toko berhasil diperbarui", store);
    } catch (error) {
      next(error);
    }
  };

  getStoreById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const store = await this.storeService.getStoreById(Number.parseInt(req.params.id));
      successResponse(res, 200, "Data toko berhasil diambil", store);
    } catch (error) {
      next(error);
    }
  };
}
