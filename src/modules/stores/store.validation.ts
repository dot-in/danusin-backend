import { z } from "zod";

export const createStoreSchema = z.object({
  body: z.object({
    store_name: z.string().min(3, "Nama toko minimal 3 karakter"),
    description: z.string().min(10, "Deskripsi minimal 10 karakter").optional(),
    whatsapp: z.string().regex(/^08\d{8,12}$/, "Nomor WhatsApp tidak valid"),
  }),
});

export const updateStoreSchema = z.object({
  body: z.object({
    store_name: z.string().min(3, "Nama toko minimal 3 karakter").optional(),
    description: z.string().min(10, "Deskripsi minimal 10 karakter").optional(),
    whatsapp: z
      .string()
      .regex(/^08\d{8,12}$/, "Nomor WhatsApp tidak valid")
      .optional(),
    pickup_locations: z
      .array(z.string().min(1, "Lokasi tidak boleh kosong"))
      .optional(),
    available_days: z
      .array(
        z.enum([
          "Senin",
          "Selasa",
          "Rabu",
          "Kamis",
          "Jumat",
          "Sabtu",
          "Minggu",
        ])
      )
      .optional(),
    is_active: z.boolean().optional(),
  }),
});

export const getStoreByIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID harus berupa angka"),
  }),
});
