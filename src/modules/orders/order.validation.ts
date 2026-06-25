import { z } from "zod";
import { ORDER_STATUS } from "../../shared/constants/status.constant.js";

const numericId = z.string().regex(/^\d+$/);

export const createOrderSchema = z.object({
  body: z.object({
    product_id: z.number().int().positive(),
    quantity: z.number().int().positive().max(1000),
    payment_method: z.enum(["COD", "DIGITAL"]),
  }),
});

export const getOrderSchema = z.object({
  params: z.object({ id: numericId }),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({ id: numericId }),
  body: z.object({
    status: z.enum([
      ORDER_STATUS.PENDING,
      ORDER_STATUS.PROCESSING,
      ORDER_STATUS.COMPLETED,
      ORDER_STATUS.CANCELLED,
    ]),
  }),
});
