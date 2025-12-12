import { z } from "zod";

export const createImageSchema = z. object({
  url: z.string(). url("URL gambar tidak valid"),
  alt_text: z. string().max(255). optional(),
  entity_type: z. enum(["product", "user"]),
  entity_id: z.number(). int(). positive("Entity ID harus positif"),
  is_primary: z.boolean().optional(). default(false),
  sort_order: z.number().int().min(0).optional(),
});

export const updateImageSchema = z.object({
  url: z.string().url("URL gambar tidak valid"). optional(),
  alt_text: z. string().max(255).optional(),
  is_primary: z. boolean().optional(),
  sort_order: z.number().int(). min(0).optional(),
});

export const getImagesQuerySchema = z.object({
  entity_type: z.enum(["product", "user"]),
  entity_id: z.coerce.number().int().positive(),
});

export const reorderImagesSchema = z.object({
  entity_type: z.enum(["product", "user"]),
  entity_id: z.number().int().positive(),
  image_ids: z. array(z.number().int().positive()),
});

export const bulkCreateImagesSchema = z.object({
  entity_type: z.enum(["product", "user"]),
  entity_id: z. number().int().positive(),
  images: z.array(
    z.object({
      url: z.string().url("URL gambar tidak valid"),
      alt_text: z.string().max(255). optional(),
      is_primary: z. boolean().optional().default(false),
    })
  ),
});

export type CreateImageInput = z.infer<typeof createImageSchema>;
export type UpdateImageInput = z. infer<typeof updateImageSchema>;
export type GetImagesQuery = z.infer<typeof getImagesQuerySchema>;
export type ReorderImagesInput = z.infer<typeof reorderImagesSchema>;
export type BulkCreateImagesInput = z.infer<typeof bulkCreateImagesSchema>;
