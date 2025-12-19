import { z } from "zod";

export const getPublicProfileSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID harus berupa angka"),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Nama minimal 2 karakter").optional(),
    phone: z.string().regex(/^08\d{8,12}$/, "Nomor telepon tidak valid").optional(),
    faculty: z.string().optional(),
    batch_year: z.number().int().min(2000).max(2030).optional(),
  }),
});

export const updateEmailSchema = z.object({
  body:  z.object({
    email: z. string().email("Format email tidak valid"),
    password: z.string().min(1, "Password diperlukan untuk verifikasi"),
  }),
});

export const updatePhoneSchema = z. object({
  body: z.object({
    phone: z.string().regex(/^08\d{8,12}$/, "Nomor telepon tidak valid"),
  }),
});

export const changePasswordSchema = z. object({
  body: z.object({
    currentPassword:  z.string().min(1, "Password saat ini diperlukan"),
    newPassword: z.string().min(8, "Password baru minimal 8 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi password diperlukan"),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message:  "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  }),
});

export const createStoreSchema = z.object({
  body: z.object({
    store_name: z.string().min(3, "Nama toko minimal 3 karakter"),
    description: z.string().min(10, "Deskripsi minimal 10 karakter").optional(),
    whatsapp: z.string().regex(/^08\d{8,12}$/, "Nomor WhatsApp tidak valid"),
  }),
});

export const getUserOrdersSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().default("1"),
    limit: z. string().regex(/^\d+$/).optional().default("10"),
    status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional(),
  }),
});
