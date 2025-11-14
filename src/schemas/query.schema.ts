import { z } from "zod";

export const listProductsQuerySchema = z
  .object({
    q: z.string().min(1).max(100).optional(),
    min_price: z.coerce.number().int().nonnegative().optional(),
    max_price: z.coerce.number().int().nonnegative().optional(),
    open_only: z.enum(["true", "false"]).optional(),
  })
  .superRefine((val, ctx) => {
    if (
      typeof val.min_price === "number" &&
      typeof val.max_price === "number" &&
      val.min_price > val.max_price
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["min_price"],
        message: "min_price tidak boleh lebih besar dari max_price",
      });
    }
  });
