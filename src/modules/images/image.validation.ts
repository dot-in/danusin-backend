import { z } from "zod";

export const createImageSchema = z.object({
  body: z.object({
    url: z.string().url(),
    alt_text: z.string().max(255).optional(),
    entity_type: z.enum(["product", "user", "store"]),
    entity_id: z.number().int().positive(),
    is_primary: z.boolean().optional().default(false),
    sort_order: z.number().int().min(0).optional(),
  }),
});

export const updateImageSchema = z.object({
  body: z.object({
    url: z.string().url().optional(),
    alt_text: z.string().max(255).optional(),
    is_primary: z.boolean().optional(),
    sort_order: z.number().int().min(0).optional(),
  }),
});

export const getImagesQuerySchema = z.object({
  query: z.object({
    entity_type: z.enum(["product", "user", "store"]),
    entity_id: z.coerce.number().int().positive(),
  }),
});

export const reorderImagesSchema = z.object({
  body: z.object({
    entity_type: z.enum(["product", "user", "store"]),
    entity_id: z.number().int().positive(),
    image_ids: z.array(z.number().int().positive()),
  }),
});

export const bulkCreateImagesSchema = z.object({
  body: z.object({
    entity_type: z.enum(["product", "user", "store"]),
    entity_id: z.number().int().positive(),
    images: z.array(
      z.object({
        url: z.string().url(),
        alt_text: z.string().max(255).optional(),
        is_primary: z.boolean().optional().default(false),
      }),
    ),
  }),
});
