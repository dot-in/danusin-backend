import { z } from "zod";
import { ORDER_STATUS } from "../constants/orderStatus.js";

export const createOrderSchema = z.object({
  product_id: z.number().int().positive(),
  quantity: z.number().int().min(1).max(100),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    ORDER_STATUS.MENUNGGU,
    ORDER_STATUS.DIPROSES,
    ORDER_STATUS.SIAP,
    ORDER_STATUS.SELESAI,
    ORDER_STATUS.DIBATALKAN,
  ]),
});
