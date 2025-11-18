import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    nim: z
      .string()
      .min(8, "NIM minimal 8 karakter")
      .max(20, "NIM maksimal 20 karakter")
      .regex(/^[0-9]+$/, "NIM harus berupa angka"),
    name: z.string().min(3, "Nama minimal 3 karakter").max(255),
    major: z.string().min(2, "Jurusan minimal 2 karakter").max(255),
    faculty: z.string().min(2, "Fakultas minimal 2 karakter").max(255),
    batch_year: z
      .number()
      .int()
      .min(2000, "Tahun angkatan minimal 2000")
      .max(new Date().getFullYear() + 1),
    whatsapp: z
      .string()
      .min(10, "Nomor WhatsApp minimal 10 digit")
      .max(15, "Nomor WhatsApp maksimal 15 digit")
      .regex(/^(\+62|62|0)[0-9]{9,13}$/, "Format nomor WhatsApp tidak valid"),
    email: z.string().email("Format email tidak valid").max(255),
    password: z
      .string()
      .min(8, "Password minimal 8 karakter")
      .max(100, "Password maksimal 100 karakter"),
    role: z.enum(["buyer", "seller"]).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    credential: z.string().min(1, "Email/NIM wajib diisi"),
    password: z.string().min(1, "Password wajib diisi"),
  }),
});

export const updateProfileSchema = z.object({
  body: z
    .object({
      name: z.string().min(3).max(255).optional(),
      major: z.string().min(2).max(255).optional(),
      faculty: z.string().min(2).max(255).optional(),
      batch_year: z
        .number()
        .int()
        .min(2000)
        .max(new Date().getFullYear() + 1)
        .optional(),
      whatsapp: z
        .string()
        .min(10)
        .max(15)
        .regex(/^(\+62|62|0)[0-9]{9,13}$/)
        .optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "Minimal satu field harus diisi",
    }),
});

export const upgradeSellerSchema = z.object({
  body: z.object({
    whatsapp: z
      .string()
      .min(10)
      .max(15)
      .regex(/^(\+62|62|0)[0-9]{9,13}$/)
      .optional(),
  }),
});
