import { Request, Response, NextFunction } from "express";
import { UserService } from "./user.service.js";
import { successResponse } from "../../shared/utils/response.util.js";

export class UsersController {
  private usersService: UserService;

  constructor() {
    this.usersService = new UserService();
  }

  getPublicProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = parseInt(req.params.id);
      const profile = await this.usersService.getPublicProfile(userId);
      successResponse(res, 200, "Profil publik berhasil diambil", profile);
    } catch (error) {
      next(error);
    }
  };
}
