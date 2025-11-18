import { z } from 'zod';

export const createProductSchema = z.object({
  body: z
    .object({
      name: z.string().min(3, 'Nama produk minimal 3 karakter').max(255),
      description: z.string().min(10, 'Deskripsi minimal 10 karakter'),
      price: z.number().int().positive('Harga harus lebih dari 0'),
      image_url: z.string().url('URL gambar tidak valid').max(500).optional(),
      po_open_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal: YYYY-MM-DD'),
      po_close_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal: YYYY-MM-DD'),
      delivery_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal: YYYY-MM-DD')
        .optional(),
    })
    .refine((data) => new Date(data.po_close_date) > new Date(data.po_open_date), {
      message: 'Tanggal tutup PO harus setelah tanggal buka',
      path: ['po_close_date'],
    })
    .refine(
      (data) => {
        if (data.delivery_date) {
          return new Date(data.delivery_date) > new Date(data.po_close_date);
        }
        return true;
      },
      {
        message: 'Tanggal pengiriman harus setelah tanggal tutup PO',
        path: ['delivery_date'],
      }
    ),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID harus berupa angka'),
  }),
  body: z
    .object({
      name: z.string().min(3).max(255).optional(),
      description: z.string().min(10).optional(),
      price: z.number().int().positive().optional(),
      image_url: z.string().url().max(500).optional(),
      po_open_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      po_close_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      delivery_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'Minimal satu field harus diisi',
    }),
});

export const deleteProductSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID harus berupa angka'),
  }),
});

export const getProductSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID harus berupa angka'),
  }),
});

export const getProductsSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    min_price: z.string().regex(/^\d+$/).optional(),
    max_price: z.string().regex(/^\d+$/).optional(),
    open_only: z.enum(['true', 'false']).optional(),
    seller_id: z.string().regex(/^\d+$/).optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
});