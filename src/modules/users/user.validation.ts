import { z } from "zod";

const numericId = z.string().regex(/^\d+$/);
const phoneRegex = /^08\d{8,12}$/;

export const getPublicProfileSchema = z.object({
  params: z.object({ id: numericId }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    phone: z.string().regex(phoneRegex).optional(),
    faculty: z.string().optional(),
    batch_year: z.number().int().min(2000).max(2030).optional(),
  }),
});

export const updateEmailSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

export const updatePhoneSchema = z.object({
  body: z.object({
    phone: z.string().regex(phoneRegex),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(1),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  }),
});

export const createStoreSchema = z.object({
  body: z.object({
    store_name: z.string().min(3),
    description: z.string().min(10).optional(),
    whatsapp: z.string().regex(phoneRegex),
  }),
});

export const getUserOrdersSchema = z.object({
  query: z.object({
    page: numericId.optional().default("1"),
    limit: numericId.optional().default("10"),
    status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional(),
  }),
});
