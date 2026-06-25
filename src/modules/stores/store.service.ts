import { prisma } from "../../core/config/database.config.js";
import { AppError } from "../../core/middlewares/error.middleware.js";
import { generateToken } from "../../shared/utils/jwt.util.js";
import { Role } from "@prisma/client";

import { CreateStoreDTO, UpdateStoreDTO } from "./store.model.js";

export class StoreService {
  async getMyStore(userId: number) {
    const store = await prisma.store.findUnique({
      where: { user_id: userId },
    });
    if (!store) return null;

    return {
      ...store,
      pickup_locations: store.pickup_locations as string[],
      available_days: store.available_days as string[],
    };
  }

  async createStore(userId: number, data: CreateStoreDTO) {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.store.findUnique({
        where: { user_id: userId },
      });
      if (existing) throw new AppError("Anda sudah memiliki toko", 409);

      const store = await tx.store.create({
        data: {
          user_id: userId,
          store_name: data.store_name,
          description: data.description || null,
          whatsapp: data.whatsapp,
          pickup_locations: [],
          available_days: [],
        },
      });

      const user = await tx.user.update({
        where: { id: userId },
        data: { role: Role.seller },
      });

      const token = generateToken({ id: user.id, nim: user.nim, name: user.name, email: user.email, role: user.role });

      return {
        id: store.id,
        store_name: store.store_name,
        description: store.description,
        whatsapp: store.whatsapp,
        message: "Toko berhasil dibuat",
        token,
      };
    });
  }

  async updateStore(userId: number, data: UpdateStoreDTO) {
    const store = await prisma.store.findUnique({
      where: { user_id: userId },
    });
    if (!store) throw new AppError("Toko tidak ditemukan", 404);

    const { pickup_locations, available_days, ...rest } = data;

    await prisma.store.update({
      where: { id: store.id },
      data: {
        ...rest,
        ...(pickup_locations && { pickup_locations }),
        ...(available_days && { available_days }),
      },
    });

    return this.getMyStore(userId);
  }

  async getStoreById(storeId: number) {
    const store = await prisma.store.findUnique({
      where: { id: storeId, is_active: true },
      include: {
        user: { select: { name: true, faculty: true, batch_year: true } },
      },
    });

    if (!store) throw new AppError("Toko tidak ditemukan", 404);

    return {
      ...store,
      owner_name: store.user.name,
      faculty: store.user.faculty,
      batch_year: store.user.batch_year,
      pickup_locations: store.pickup_locations as string[],
      available_days: store.available_days as string[],
    };
  }
}
