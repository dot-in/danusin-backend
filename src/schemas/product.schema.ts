import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createProductSchema = z
  .object({
    name: z.string().min(2).max(150),
    description: z.string().max(2000).optional(),
    price: z.number().int().positive(),
    image_url: z.string().url().optional(),
    po_open_date: z.string().regex(dateRegex, "Format tanggal YYYY-MM-DD"),
    po_close_date: z.string().regex(dateRegex, "Format tanggal YYYY-MM-DD"),
    delivery_date: z.string().regex(dateRegex, "Format tanggal YYYY-MM-DD"),
  })
  .superRefine((val, ctx) => {
    if (val.po_open_date > val.po_close_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["po_open_date"],
        message: "po_open_date harus <= po_close_date",
      });
    }
    if (val.delivery_date < val.po_close_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["delivery_date"],
        message: "delivery_date harus >= po_close_date",
      });
    }
  });

export const updateProductSchema = createProductSchema
  .partial()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "Tidak ada field yang diupdate",
  });
