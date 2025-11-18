import { Response } from "express";

interface SuccessResponse<T = any> {
  message: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

interface ErrorResponse {
  message: string;
  errors?: Array<{
    path: string;
    message: string;
  }>;
}

export const successResponse = <T = any>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T,
  meta?: SuccessResponse["meta"]
): Response => {
  const response: SuccessResponse<T> = { message };

  if (data !== undefined) {
    response.data = data;
  }

  if (meta) {
    response.meta = meta;
  }
  return res.status(statusCode).json(response);
};

export const errorResponse = (
  res: Response,
  statusCode: number,
  message: string,
  errors?: ErrorResponse["errors"]
): Response => {
  const response: ErrorResponse = { message };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

export const paginatedResponse = <T = any>(
  res: Response,
  statusCode: number,
  message: string,
  data: T,
  page: number,
  limit: number,
  total: number
): Response => {
  return successResponse(res, statusCode, message, data, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
};
