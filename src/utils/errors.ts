export class AppError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function fail(message: string, status = 400): never {
  throw new AppError(message, status);
}

export function assert(
  condition: any,
  message: string,
  status = 400
): asserts condition {
  if (!condition) {
    throw new AppError(message, status);
  }
}
