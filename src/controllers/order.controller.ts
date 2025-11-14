import { Request, Response } from "express";
import {
  createOrder,
  listSellerOrders,
  listBuyerOrders,
  updateOrderStatus,
} from "../services/order.service.js";
import { ORDER_STATUS, OrderStatus } from "../constants/orderStatus.js";

export async function createOrderController(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  const order = await createOrder(req.user.id, req.body);
  res.status(201).json({ message: "Order berhasil dibuat", order });
}

export async function listBuyerOrdersController(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  const orders = await listBuyerOrders(req.user.id);
  res.json(orders);
}

export async function listSellerOrdersController(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  const orders = await listSellerOrders(req.user.id);
  res.json(orders);
}

export async function updateOrderStatusController(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  const orderId = Number(req.params.id);
  const { status } = req.body;
  const validValues = Object.values(ORDER_STATUS);
  if (!validValues.includes(status)) {
    return res
      .status(400)
      .json({
        message: `Status tidak valid. Nilai yang diperbolehkan: ${validValues.join(
          ", "
        )}`,
      });
  }
  const result = await updateOrderStatus(
    req.user.id,
    orderId,
    status as OrderStatus
  );
  res.json(result);
}
