declare global {
  namespace Express {
    interface Request {
      user?: { id: number; role: "buyer" | "seller" };
    }
  }
}

export {};
