import { prisma } from "../../core/config/database.config.js";
import { AppError } from "../../core/middlewares/error.middleware.js";
import { EntityType, Prisma } from "@prisma/client";

interface CreateImageDTO {
  url: string;
  alt_text?: string;
  entity_type: EntityType;
  entity_id: number;
  is_primary?: boolean;
  sort_order?: number;
}

interface UpdateImageDTO {
  url?: string;
  alt_text?: string;
  is_primary?: boolean;
  sort_order?: number;
}

export class ImageService {
  private getClient(tx?: Prisma.TransactionClient) {
    return tx || prisma;
  }

  async getByEntity(entityType: EntityType, entityId: number, tx?: Prisma.TransactionClient) {
    return await this.getClient(tx).image.findMany({
      where: { entity_type: entityType, entity_id: entityId },
      orderBy: [{ is_primary: "desc" }, { sort_order: "asc" }],
    });
  }

  async getById(imageId: number, tx?: Prisma.TransactionClient) {
    return await this.getClient(tx).image.findUnique({
      where: { id: imageId },
    });
  }

  async getPrimaryImage(entityType: EntityType, entityId: number, tx?: Prisma.TransactionClient) {
    return await this.getClient(tx).image.findFirst({
      where: { entity_type: entityType, entity_id: entityId, is_primary: true },
    });
  }

  async getPrimaryImagesForEntities(entityType: EntityType, entityIds: number[], tx?: Prisma.TransactionClient): Promise<Map<number, string>> {
    if (entityIds.length === 0) return new Map();
    const images = await this.getClient(tx).image.findMany({
      where: {
        entity_type: entityType,
        entity_id: { in: entityIds },
        is_primary: true,
      },
      select: { entity_id: true, url: true },
    });
    const imageMap = new Map<number, string>();
    images.forEach((img) => imageMap.set(img.entity_id, img.url));
    return imageMap;
  }

  async create(data: CreateImageDTO, tx?: Prisma.TransactionClient) {
    const client = this.getClient(tx);
    if (data.is_primary) {
      await client.image.updateMany({
        where: { entity_type: data.entity_type, entity_id: data.entity_id },
        data: { is_primary: false },
      });
    }

    let sortOrder = data.sort_order;
    if (sortOrder === undefined) {
      const agg = await client.image.aggregate({
        where: { entity_type: data.entity_type, entity_id: data.entity_id },
        _max: { sort_order: true },
      });
      sortOrder = (agg._max.sort_order ?? -1) + 1;
    }

    return await client.image.create({
      data: {
        ...data,
        sort_order: sortOrder,
        is_primary: data.is_primary || false,
      },
    });
  }

  async createMany(images: CreateImageDTO[], tx?: Prisma.TransactionClient) {
    if (images.length === 0) return [];
    // Prisma createMany doesn't return created objects with IDs easily in all DBs,
    // so we iterate or use a transaction if not already in one.
    const created = [];
    for (const imageData of images) {
      created.push(await this.create(imageData, tx));
    }
    return created;
  }

  async update(imageId: number, data: UpdateImageDTO, tx?: Prisma.TransactionClient) {
    const client = this.getClient(tx);
    const existing = await client.image.findUnique({ where: { id: imageId } });
    if (!existing) throw new AppError("Image tidak ditemukan", 404);

    if (data.is_primary) {
      await client.image.updateMany({
        where: {
          entity_type: existing.entity_type,
          entity_id: existing.entity_id,
          id: { not: imageId },
        },
        data: { is_primary: false },
      });
    }

    return await client.image.update({
      where: { id: imageId },
      data,
    });
  }

  async setPrimary(imageId: number, tx?: Prisma.TransactionClient) {
    const client = this.getClient(tx);
    const existing = await client.image.findUnique({ where: { id: imageId } });
    if (!existing) throw new AppError("Image tidak ditemukan", 404);

    await client.image.updateMany({
      where: { entity_type: existing.entity_type, entity_id: existing.entity_id },
      data: { is_primary: false },
    });

    return await client.image.update({
      where: { id: imageId },
      data: { is_primary: true },
    });
  }

  async delete(imageId: number, tx?: Prisma.TransactionClient) {
    const client = this.getClient(tx);
    const existing = await client.image.findUnique({ where: { id: imageId } });
    if (!existing) throw new AppError("Image tidak ditemukan", 404);

    await client.image.delete({ where: { id: imageId } });

    if (existing.is_primary) {
      const nextPrimary = await client.image.findFirst({
        where: { entity_type: existing.entity_type, entity_id: existing.entity_id },
        orderBy: { sort_order: "asc" },
      });
      if (nextPrimary) {
        await client.image.update({
          where: { id: nextPrimary.id },
          data: { is_primary: true },
        });
      }
    }
  }

  async deleteByEntity(entityType: EntityType, entityId: number, tx?: Prisma.TransactionClient) {
    await this.getClient(tx).image.deleteMany({
      where: { entity_type: entityType, entity_id: entityId },
    });
  }

  async reorder(entityType: EntityType, entityId: number, imageIds: number[], tx?: Prisma.TransactionClient) {
    const client = this.getClient(tx);
    for (let i = 0; i < imageIds.length; i++) {
      await client.image.update({
        where: {
          id: imageIds[i],
          entity_type: entityType,
          entity_id: entityId,
        },
        data: { sort_order: i },
      });
    }
  }
}
