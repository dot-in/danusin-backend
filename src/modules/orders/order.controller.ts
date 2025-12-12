import type { Request, Response, NextFunction } from "express";
import { OrderService } from "./order.service.js";
import { successResponse, errorResponse } from "../../shared/utils/response.util.js";
import { SUCCESS_MESSAGES } from "../../shared/constants/message.constant.js";

export class OrdersController {
  private orderService: OrderService;

  constructor() {
    this.orderService = new OrderService();
  }

  create = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        errorResponse(res, 401, "Unauthorized");
        return;
      }
      const order = await this.orderService.create(req.user.id, req.body);
      successResponse(res, 201, SUCCESS_MESSAGES.ORDER.CREATED, { order });
    } catch (error) {
      next(error);
    }
  };

  getMyOrders = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        errorResponse(res, 401, "Unauthorized");
        return;
      }
      const orders = await this.orderService.getMyOrders(req.user.id);
      successResponse(res, 200, "Riwayat pesanan berhasil diambil", orders);
    } catch (error) {
      next(error);
    }
  };

  getIncomingOrders = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        errorResponse(res, 401, "Unauthorized");
        return;
      }
      const orders = await this.orderService.getIncomingOrders(req.user.id);
      successResponse(res, 200, "Pesanan masuk berhasil diambil", orders);
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
      if (!req.user) {
        errorResponse(res, 401, "Unauthorized");
        return;
      }
      const orderId = Number.parseInt(req.params.id);
      const order = await this.orderService.getById(
        orderId,
        req.user.id,
        req.user.role
      );
      successResponse(res, 200, "Detail pesanan berhasil diambil", order);
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        errorResponse(res, 401, "Unauthorized");
        return;
      }
      const orderId = Number.parseInt(req.params.id);
      const order = await this.orderService.updateStatus(
        orderId,
        req.user.id,
        req.body.status
      );
      successResponse(res, 200, SUCCESS_MESSAGES.ORDER.STATUS_UPDATED, {
        order,
      });
    } catch (error) {
      next(error);
    }
  };
}
