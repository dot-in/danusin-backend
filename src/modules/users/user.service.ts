import { prisma } from "../../core/config/database.config.js";
import { AppError } from "../../core/middlewares/error.middleware.js";
import { ERROR_MESSAGES } from "../../shared/constants/message.constant.js";
import { hashPassword, comparePassword } from "../../shared/utils/bcrypt.util.js";
import { generateToken } from "../../shared/utils/jwt.util.js";
import { Role, EntityType } from "@prisma/client";
import { UpdateUserDTO, ChangePasswordDTO } from "./user.model.js";

export class UserService {
  async getPublicProfile(userId: number) {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        role: Role.seller,
      },
      select: {
        id: true,
        name: true,
        faculty: true,
        batch_year: true,
        major: true,
        store: {
          where: { is_active: true },
          select: {
            store_name: true,
            description: true,
          },
        },
        _count: {
          select: {
            products: {
              where: {
                is_active: true,
                po_close_date: { gte: new Date() },
              },
            },
          },
        },
      },
    });

    if (!user) throw new AppError(ERROR_MESSAGES.USER.NOT_FOUND, 404);

    const profileImage = await prisma.image.findFirst({
      where: {
        entity_type: EntityType.user,
        entity_id: userId,
        is_primary: true,
      },
      select: { url: true },
    });

    return {
      id: user.id,
      name: user.name,
      faculty: user.faculty,
      batch_year: user.batch_year,
      major: user.major,
      active_products_count: user._count.products,
      profile_image: profileImage?.url || null,
      store_name: user.store?.store_name || null,
      store_description: user.store?.description || null,
    };
  }

  async getMyProfile(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        notifications: {
          take: 0,
        },
      },
    });

    if (!user) throw new AppError(ERROR_MESSAGES.USER.NOT_FOUND, 404);

    const profileImage = await prisma.image.findFirst({
      where: {
        entity_type: EntityType.user,
        entity_id: userId,
        is_primary: true,
      },
      select: { url: true },
    });

    return {
      id: user.id,
      nim: user.nim,
      name: user.name,
      email: this.maskEmail(user.email),
      whatsapp: user.whatsapp ? this.maskPhone(user.whatsapp) : null,
      major: user.major,
      faculty: user.faculty,
      batch_year: user.batch_year,
      role: user.role,
      created_at: user.created_at,
      profile_image: profileImage?.url || null,
    };
  }

  async updateProfile(userId: number, data: UpdateUserDTO) {
    if (Object.keys(data).length === 0) throw new AppError("Tidak ada data yang diperbarui", 400);

    await prisma.user.update({
      where: { id: userId },
      data,
    });
    return this.getMyProfile(userId);
  }

  async updateProfileImage(userId: number, imageUrl: string) {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.image.findFirst({
        where: {
          entity_type: EntityType.user,
          entity_id: userId,
          is_primary: true,
        },
      });

      if (existing) {
        await tx.image.update({
          where: { id: existing.id },
          data: { url: imageUrl },
        });
      } else {
        await tx.image.create({
          data: {
            url: imageUrl,
            alt_text: "Profile image",
            entity_type: EntityType.user,
            entity_id: userId,
            is_primary: true,
            sort_order: 0,
          },
        });
      }
      return this.getMyProfile(userId);
    });
  }

  async updateEmail(userId: number, email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user) throw new AppError(ERROR_MESSAGES.USER.NOT_FOUND, 404);
    if (!(await comparePassword(password, user.password))) throw new AppError("Password tidak valid", 401);

    const existing = await prisma.user.findFirst({
      where: {
        email,
        id: { not: userId },
      },
    });

    if (existing) throw new AppError("Email sudah digunakan", 409);

    await prisma.user.update({
      where: { id: userId },
      data: { email },
    });

    return { message: "Email berhasil diperbarui" };
  }

  async updatePhone(userId: number, phone: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { whatsapp: phone },
    });
    return { message: "Nomor telepon berhasil diperbarui" };
  }

  async changePassword(userId: number, data: ChangePasswordDTO) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user) throw new AppError(ERROR_MESSAGES.USER.NOT_FOUND, 404);
    if (!(await comparePassword(data.current_password, user.password))) throw new AppError("Password saat ini tidak valid", 401);

    const hashed = await hashPassword(data.new_password);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    return { message: "Password berhasil diperbarui" };
  }

  async getUserOrders(userId: number, options: { page: number; limit: number; status?: any }) {
    const skip = (options.page - 1) * options.limit;
    const where: any = { buyer_id: userId };
    if (options.status) where.status = options.status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          product: {
            include: {
              seller: {
                include: {
                  store: true,
                },
              },
            },
          },
        },
        orderBy: { created_at: "desc" },
        skip,
        take: options.limit,
      }),
      prisma.order.count({ where }),
    ]);

    const productIds = orders.map((o) => o.product_id);
    const images = await prisma.image.findMany({
      where: {
        entity_type: EntityType.product,
        entity_id: { in: productIds },
        is_primary: true,
      },
    });

    const formattedOrders = orders.map((o) => ({
      id: o.id,
      product_id: o.product_id,
      quantity: o.quantity,
      total_price: o.total_price,
      status: o.status,
      pickup_location: o.pickup_location,
      pickup_day: o.pickup_day,
      created_at: o.created_at,
      product_name: o.product.name,
      product_image: images.find((img) => img.entity_id === o.product_id)?.url || null,
      seller_name: o.product.seller.name,
      store_name: o.product.seller.store?.store_name || null,
    }));

    return {
      orders: formattedOrders,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        totalPages: Math.ceil(total / options.limit),
      },
    };
  }

  async createStore(userId: number, data: { store_name: string; description?: string; whatsapp: string }) {
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

      const token = generateToken({
        id: user.id,
        nim: user.nim,
        name: user.name,
        email: user.email,
        role: user.role,
      });

      return { id: store.id, message: "Toko berhasil dibuat", token };
    });
  }

  async getMyStore(userId: number) {
    return await prisma.store.findUnique({
      where: { user_id: userId },
    });
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split("@");
    return `${local.charAt(0)}${"*".repeat(local.length - 1)}@${domain}`;
  }

  private maskPhone(phone: string): string {
    if (phone.length <= 6) return phone;
    return `${phone.slice(0, 4)}${"*".repeat(phone.length - 6)}${phone.slice(-2)}`;
  }
}
