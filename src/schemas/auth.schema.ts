import { z } from "zod";

const nimRegex = /^[0-9]{6,20}$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const registerSchema = z
  .object({
    nim: z.string().regex(nimRegex, "Format NIM tidak valid (6-20 digit)"),
    name: z.string().min(2, "Nama minimal 2 karakter").max(150).optional(),
    major: z.string().max(150).optional(),
    faculty: z.string().max(150).optional(),
    batch_year: z.coerce
      .number()
      .int()
      .gte(2000)
      .lte(new Date().getFullYear() + 1)
      .optional(),
    whatsapp: z.string().min(8, "Whatsapp minimal 8 digit").max(30).optional(),
    email: z.string().email("Format email tidak valid").optional(),
    password: z.string().min(6, "Password minimal 6 karakter"),
    role: z.enum(["buyer", "seller"]),
  })
  .superRefine((val, ctx) => {
    if (val.role === "seller" && !val.whatsapp) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["whatsapp"],
        message: "Whatsapp wajib untuk seller",
      });
    }
  });

export const loginSchema = z.object({
  credential: z.string().min(3, "credential minimal 3 karakter"),
  password: z.string().min(6),
});

export const updateProfileSchema = z
  .object({
    name: z.string().min(2).max(150).optional(),
    major: z.string().max(150).optional(),
    faculty: z.string().max(150).optional(),
    batch_year: z
      .number()
      .int()
      .gte(2000)
      .lte(new Date().getFullYear() + 1)
      .optional(),
    whatsapp: z.string().min(8).max(30).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "Harus ada minimal satu field untuk diupdate",
  });

export const upgradeSellerSchema = z.object({
  whatsapp: z.string().min(8).max(30).optional(),
});
