import { z } from "zod";

const phoneRegex = /^08\d{8,12}$/;
const days = z.enum(["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]);

export const createStoreSchema = z.object({
  body: z.object({
    store_name: z.string().min(3),
    description: z.string().optional(),
    whatsapp: z.string().regex(phoneRegex),
  }),
});

export const updateStoreSchema = z.object({
  body: z.object({
    store_name: z.string().min(3).optional(),
    description: z.string().optional(),
    whatsapp: z.string().regex(phoneRegex).optional(),
    pickup_locations: z.array(z.string().min(1)).optional(),
    available_days: z.array(days).optional(),
    is_active: z.boolean().optional(),
  }),
});

export const getStoreByIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/),
  }),
});
