import { z } from "zod";

export const getPublicProfileSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID harus berupa angka"),
  }),
});
