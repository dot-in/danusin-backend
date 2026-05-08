import type { Request, Response, NextFunction } from "express";
import { OrderService } from "./order.service.js";
import { successResponse } from "../../shared/utils/response.util.js";
import { SUCCESS_MESSAGES } from "../../shared/constants/message.constant.js";
import { AppError } from "../../core/middlewares/error.middleware.js";

export class OrdersController {
  private orderService = new OrderService();

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401);
      const order = await this.orderService.create(req.user.id, req.body);
      successResponse(res, 201, SUCCESS_MESSAGES.ORDER.CREATED, { order });
    } catch (error) {
      next(error);
    }
  };

  getMyOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401);
      const orders = await this.orderService.getMyOrders(req.user.id);
      successResponse(res, 200, "Riwayat pesanan berhasil diambil", orders);
    } catch (error) {
      next(error);
    }
  };

  getIncomingOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401);
      const orders = await this.orderService.getIncomingOrders(req.user.id);
      successResponse(res, 200, "Pesanan masuk berhasil diambil", orders);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401);
      const order = await this.orderService.getById(Number.parseInt(req.params.id), req.user.id, req.user.role as "buyer" | "seller");
      successResponse(res, 200, "Detail pesanan berhasil diambil", order);
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401);
      const order = await this.orderService.updateStatus(Number.parseInt(req.params.id), req.user.id, req.body.status);
      successResponse(res, 200, SUCCESS_MESSAGES.ORDER.STATUS_UPDATED, { order });
    } catch (error) {
      next(error);
    }
  };

  cancelOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401);
      const order = await this.orderService.cancelOrder(Number.parseInt(req.params.id), req.user.id);
      successResponse(res, 200, "Pesanan berhasil dibatalkan", { order });
    } catch (error) {
      next(error);
    }
  };
}
