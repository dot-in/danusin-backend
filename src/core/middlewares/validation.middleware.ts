import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";
import { ZodError } from "zod";
import { errorResponse } from "../../shared/utils/response.util.js";

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err) => ({
          path: err.path.slice(1).join("."),
          message: err.message,
        }));
        errorResponse(res, 400, "Validasi gagal", errors);
        return;
      }
      errorResponse(res, 400, "Validasi gagal");
    }
  };
};
