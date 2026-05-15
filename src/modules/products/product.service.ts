import { prisma } from "../../core/config/database.config.js";
import { AppError } from "../../core/middlewares/error.middleware.js";
import { ERROR_MESSAGES } from "../../shared/constants/message.constant.js";
import { ImageService } from "../images/image.service.js";
import { getAvailableDays } from "../../shared/utils/date.util.js";
import { EntityType, Prisma } from "@prisma/client";

const imageService = new ImageService();

import {
  CreateProductDTO,
  UpdateProductDTO,
  GetProductsQuery,
} from "./product.model.js";

export class ProductService {
  private getClient(tx?: Prisma.TransactionClient) {
    return tx || prisma;
  }

  async getAll(query: GetProductsQuery, tx?: Prisma.TransactionClient) {
    const client = this.getClient(tx);
    const {
      q,
      min_price,
      max_price,
      open_only,
      seller_id,
      page = 1,
      limit = 20,
    } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      is_active: true,
    };

    if (q) {
      where.OR = [{ name: { contains: q } }, { description: { contains: q } }];
    }
    if (min_price !== undefined)
      where.price = { ...where.price, gte: min_price };
    if (max_price !== undefined)
      where.price = { ...where.price, lte: max_price };
    if (open_only) {
      const today = new Date();
      where.po_open_date = { lte: today };
      where.po_close_date = { gte: today };
    }
    if (seller_id) where.seller_id = seller_id;

    const [products, total] = await Promise.all([
      client.product.findMany({
        where,
        include: {
          seller: {
            select: { name: true, faculty: true, whatsapp: true },
          },
        },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      client.product.count({ where }),
    ]);

    const productIds = products.map((p) => p.id);
    const imageMap = await imageService.getPrimaryImagesForEntities(
      EntityType.product,
      productIds,
      tx,
    );

    const formattedProducts = products.map((p) => ({
      ...p,
      seller_name: p.seller.name,
      seller_faculty: p.seller.faculty,
      seller_whatsapp: p.seller.whatsapp,
      primary_image: imageMap.get(p.id) || null,
      available_days: getAvailableDays(p.po_open_date, p.po_close_date),
    }));

    return {
      products: formattedProducts,
      total,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(productId: number, tx?: Prisma.TransactionClient) {
    const client = this.getClient(tx);
    const product = await client.product.findUnique({
      where: { id: productId },
      include: {
        seller: {
          select: { name: true, faculty: true, whatsapp: true },
        },
      },
    });

    if (!product) throw new AppError(ERROR_MESSAGES.PRODUCT.NOT_FOUND, 404);

    const images = await imageService.getByEntity(
      EntityType.product,
      productId,
      tx,
    );
    const primaryImage = images.find((img) => img.is_primary) || images[0];

    return {
      ...product,
      seller_name: product.seller.name,
      seller_faculty: product.seller.faculty,
      seller_whatsapp: product.seller.whatsapp,
      images,
      primary_image: primaryImage?.url || null,
      available_days: getAvailableDays(
        product.po_open_date,
        product.po_close_date,
      ),
    };
  }

  async getMySeller(sellerId: number, tx?: Prisma.TransactionClient) {
    const client = this.getClient(tx);
    const products = await client.product.findMany({
      where: { seller_id: sellerId },
      orderBy: { created_at: "desc" },
    });

    const productIds = products.map((p) => p.id);
    const imageMap = await imageService.getPrimaryImagesForEntities(
      EntityType.product,
      productIds,
      tx,
    );

    return products.map((p) => ({
      ...p,
      primary_image: imageMap.get(p.id) || null,
      available_days: getAvailableDays(p.po_open_date, p.po_close_date),
    }));
  }

  async create(sellerId: number, data: CreateProductDTO) {
    return await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          seller_id: sellerId,
          name: data.name,
          description: data.description,
          price: data.price,
          stock: data.stock || 0,
          po_open_date: new Date(data.po_open_date),
          po_close_date: new Date(data.po_close_date),
          delivery_date: data.delivery_date
            ? new Date(data.delivery_date)
            : null,
          pickup_locations: [],
          available_days: [],
        },
      });

      if (data.images?.length) {
        const imageData = data.images.map((url, index) => ({
          url,
          entity_type: EntityType.product,
          entity_id: product.id,
          is_primary: index === 0,
          sort_order: index,
        }));
        await imageService.createMany(imageData, tx);
      }

      return this.getById(product.id, tx);
    });
  }

  async update(productId: number, sellerId: number, data: UpdateProductDTO) {
    return await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) throw new AppError(ERROR_MESSAGES.PRODUCT.NOT_FOUND, 404);
      if (product.seller_id !== sellerId)
        throw new AppError(ERROR_MESSAGES.PRODUCT.NOT_OWNER, 403);

      const { images, add_images, remove_image_ids, ...productData } = data;

      await tx.product.update({
        where: { id: productId },
        data: {
          ...productData,
          po_open_date: productData.po_open_date
            ? new Date(productData.po_open_date)
            : undefined,
          po_close_date: productData.po_close_date
            ? new Date(productData.po_close_date)
            : undefined,
          delivery_date:
            productData.delivery_date === null
              ? null
              : productData.delivery_date
                ? new Date(productData.delivery_date)
                : undefined,
        },
      });

      if (images !== undefined) {
        await imageService.deleteByEntity(EntityType.product, productId, tx);
        if (images.length > 0) {
          const imageData = images.map((url, index) => ({
            url,
            entity_type: EntityType.product,
            entity_id: productId,
            is_primary: index === 0,
            sort_order: index,
          }));
          await imageService.createMany(imageData, tx);
        }
      }

      if (add_images?.length) {
        const existingImages = await imageService.getByEntity(
          EntityType.product,
          productId,
          tx,
        );
        const imageData = add_images.map((url, index) => ({
          url,
          entity_type: EntityType.product,
          entity_id: productId,
          is_primary: existingImages.length === 0 && index === 0,
          sort_order: existingImages.length + index,
        }));
        await imageService.createMany(imageData, tx);
      }

      if (remove_image_ids?.length) {
        for (const imageId of remove_image_ids) {
          await imageService.delete(imageId, tx);
        }
      }

      return this.getById(productId, tx);
    });
  }

  async delete(productId: number, sellerId: number) {
    await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) throw new AppError(ERROR_MESSAGES.PRODUCT.NOT_FOUND, 404);
      if (product.seller_id !== sellerId)
        throw new AppError(ERROR_MESSAGES.PRODUCT.NOT_OWNER, 403);

      await imageService.deleteByEntity(EntityType.product, productId, tx);
      await tx.product.delete({ where: { id: productId } });
    });
  }
}
