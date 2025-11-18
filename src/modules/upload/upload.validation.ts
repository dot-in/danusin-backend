import { z } from "zod";

export const uploadImageSchema = z.object({
  body: z.object({
    image: z.any().optional(),
  }),
});
