import { z } from "zod";

export const createReviewSchema = z.object({
  body: z.object({
    order_id: z.number().int().positive(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(1000).optional(),
    images: z.array(z.string().url()).max(5).optional(),
  }),
});

export const getProductReviewsSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/).transform(Number),
  }),
});

export const deleteReviewSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/).transform(Number),
  }),
});
