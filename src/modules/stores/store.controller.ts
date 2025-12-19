import type { Request, Response, NextFunction } from "express";
import { StoreService } from "./store.service.js";
import {
  successResponse,
  errorResponse,
} from "../../shared/utils/response.util.js";

export class StoreController {
  private storeService: StoreService;

  constructor() {
    this.storeService = new StoreService();
  }

  // Get current user's store
  getMyStore = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const store = await this.storeService.getMyStore(userId);

      if (!store) {
        errorResponse(res, 404, "Anda belum memiliki toko");
        return;
      }

      successResponse(res, 200, "Data toko berhasil diambil", store);
    } catch (error) {
      next(error);
    }
  };

  // Create store (upgrade to seller)
  createStore = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const result = await this.storeService.createStore(userId, req.body);
      successResponse(res, 201, result.message, {
        id: result.id,
        store_name: result.store_name,
        description: result.description,
        whatsapp: result.whatsapp,
        token: result.token,
      });
    } catch (error) {
      next(error);
    }
  };

  // Update store
  updateStore = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const store = await this.storeService.updateStore(userId, req.body);
      successResponse(res, 200, "Toko berhasil diperbarui", store);
    } catch (error) {
      next(error);
    }
  };

  // Get store by ID (public)
  getStoreById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const storeId = parseInt(req.params.id, 10);
      const store = await this.storeService.getStoreById(storeId);
      successResponse(res, 200, "Data toko berhasil diambil", store);
    } catch (error) {
      next(error);
    }
  };
}
