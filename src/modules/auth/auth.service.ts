import { prisma } from "../../core/config/database.config.js";
import { AppError } from "../../core/middlewares/error.middleware.js";
import {
  hashPassword,
  comparePassword,
} from "../../shared/utils/bcrypt.util.js";
import { generateToken } from "../../shared/utils/jwt.util.js";
import { ERROR_MESSAGES } from "../../shared/constants/message.constant.js";
import type { UserWithoutPassword } from "../../shared/types/common.types.js";
import { Role } from "@prisma/client";

import { RegisterDTO, UpdateProfileDTO } from "./auth.model.js";

export class AuthService {
  async register(userData: RegisterDTO): Promise<UserWithoutPassword> {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findFirst({
        where: {
          OR: [{ nim: userData.nim }, { email: userData.email }],
        },
      });

      if (existing) {
        if (existing.nim === userData.nim)
          throw new AppError(ERROR_MESSAGES.AUTH.NIM_EXISTS, 400);
        if (existing.email === userData.email)
          throw new AppError(ERROR_MESSAGES.AUTH.EMAIL_EXISTS, 400);
      }

      const hashedPassword = await hashPassword(userData.password);
      const user = await tx.user.create({
        data: {
          ...userData,
          password: hashedPassword,
          role: userData.role || Role.buyer,
        },
      });

      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword as UserWithoutPassword;
    });
  }

  async login(
    credential: string,
    password: string,
  ): Promise<{ token: string; user: UserWithoutPassword }> {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ nim: credential }, { email: credential }],
      },
    });

    if (!user) throw new AppError(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS, 401);
    if (!(await comparePassword(password, user.password)))
      throw new AppError(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS, 401);

    const token = generateToken({
      id: user.id,
      nim: user.nim,
      name: user.name,
      email: user.email,
      role: user.role,
    });
    const { password: _, ...userWithoutPassword } = user;
    return { token, user: userWithoutPassword as UserWithoutPassword };
  }

  async getProfile(userId: number): Promise<UserWithoutPassword> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new AppError(ERROR_MESSAGES.USER.NOT_FOUND, 404);
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as UserWithoutPassword;
  }

  async updateProfile(
    userId: number,
    updateData: UpdateProfileDTO,
  ): Promise<UserWithoutPassword> {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });

      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword as UserWithoutPassword;
    } catch (error: any) {
      if (error.code === "P2025")
        throw new AppError(ERROR_MESSAGES.USER.NOT_FOUND, 404);
      throw error;
    }
  }

  async upgradeSeller(
    userId: number,
    whatsapp?: string,
  ): Promise<UserWithoutPassword> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) throw new AppError(ERROR_MESSAGES.USER.NOT_FOUND, 404);
    if (user.role === Role.seller)
      throw new AppError(ERROR_MESSAGES.AUTH.ALREADY_SELLER, 403);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role: Role.seller,
        ...(whatsapp && { whatsapp }),
      },
    });

    const { password: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword as UserWithoutPassword;
  }
}
