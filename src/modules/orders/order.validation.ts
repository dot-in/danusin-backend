import { z } from "zod";
import { ORDER_STATUS } from "../../shared/constants/status.constant.js";

export const createOrderSchema = z.object({
  body: z.object({
    product_id: z.number().int().positive("Product ID harus valid"),
    quantity: z
      .number()
      .int()
      .positive("Quantity harus lebih dari 0")
      .max(1000, "Quantity maksimal 1000"),
  }),
});

export const getOrderSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID harus berupa angka"),
  }),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID harus berupa angka"),
  }),
  body: z.object({
    status: z.enum([
      ORDER_STATUS.PENDING,
      ORDER_STATUS.PROCESSING,
      ORDER_STATUS.COMPLETED,
      ORDER_STATUS.CANCELLED,
    ]),
  }),
});
