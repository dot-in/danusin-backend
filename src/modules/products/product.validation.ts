import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const numericString = z.string().regex(/^\d+$/);

export const createProductSchema = z.object({
  body: z
    .object({
      name: z.string().min(3).max(255),
      description: z.string().min(10),
      price: z.number().int().positive(),
      stock: z.number().int().min(0).default(0),
      images: z.array(z.string().url()).optional(),
      po_open_date: z.string().regex(dateRegex),
      po_close_date: z.string().regex(dateRegex),
      delivery_date: z.string().regex(dateRegex).optional(),
    })
    .refine((data) => new Date(data.po_close_date) > new Date(data.po_open_date), {
      message: "Tanggal tutup PO harus setelah tanggal buka",
      path: ["po_close_date"],
    })
    .refine(
      (data) => !data.delivery_date || new Date(data.delivery_date) > new Date(data.po_close_date),
      {
        message: "Tanggal pengiriman harus setelah tanggal tutup PO",
        path: ["delivery_date"],
      }
    ),
});

export const updateProductSchema = z.object({
  params: z.object({ id: numericString }),
  body: z
    .object({
      name: z.string().min(3).max(255).optional(),
      description: z.string().min(10).optional(),
      price: z.number().int().positive().optional(),
      stock: z.number().int().min(0).optional(),
      images: z.array(z.string().url()).optional(),
      add_images: z.array(z.string().url()).optional(),
      remove_image_ids: z.array(z.number().int().positive()).optional(),
      po_open_date: z.string().regex(dateRegex).optional(),
      po_close_date: z.string().regex(dateRegex).optional(),
      delivery_date: z.string().regex(dateRegex).optional().nullable(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "Minimal satu field harus diisi",
    }),
});

export const deleteProductSchema = z.object({
  params: z.object({ id: numericString }),
});

export const getProductSchema = z.object({
  params: z.object({ id: numericString }),
});

export const getProductsSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    min_price: numericString.optional(),
    max_price: numericString.optional(),
    open_only: z.enum(["true", "false"]).optional(),
    seller_id: numericString.optional(),
    page: numericString.optional(),
    limit: numericString.optional(),
  }),
});
