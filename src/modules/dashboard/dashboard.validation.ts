import { z } from "zod";

export const getSellerSummarySchema = z.object({
  query: z.object({
    period: z.enum(["today", "week", "month", "year"]).optional(),
  }),
});
