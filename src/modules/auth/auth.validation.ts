import { z } from "zod";

const nimRegex = /^[0-9]+$/;
const whatsappRegex = /^(\+62|62|0)[0-9]{9,13}$/;

export const registerSchema = z.object({
  body: z.object({
    nim: z.string().min(8).max(20).regex(nimRegex),
    name: z.string().min(3).max(255),
    major: z.string().min(2).max(255),
    faculty: z.string().min(2).max(255),
    batch_year: z.number().int().min(2000).max(new Date().getFullYear() + 1),
    whatsapp: z.string().min(10).max(15).regex(whatsappRegex),
    email: z.string().email().max(255),
    password: z.string().min(8).max(100),
    role: z.enum(["buyer", "seller"]).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    credential: z.string().min(1),
    password: z.string().min(1),
  }),
});

export const updateProfileSchema = z.object({
  body: z
    .object({
      name: z.string().min(3).max(255).optional(),
      major: z.string().min(2).max(255).optional(),
      faculty: z.string().min(2).max(255).optional(),
      batch_year: z.number().int().min(2000).max(new Date().getFullYear() + 1).optional(),
      whatsapp: z.string().min(10).max(15).regex(whatsappRegex).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "Minimal satu field harus diisi",
    }),
});

export const upgradeSellerSchema = z.object({
  body: z.object({
    whatsapp: z.string().min(10).max(15).regex(whatsappRegex).optional(),
  }),
});
