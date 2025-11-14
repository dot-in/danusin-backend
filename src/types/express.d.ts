import type { User } from "./entities";

declare global {
  namespace Express {
    interface Request {
      user?: { id: number; role: User["role"] };
    }
  }
}
export {};
