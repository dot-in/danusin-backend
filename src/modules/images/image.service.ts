import type { ResultSetHeader, RowDataPacket, PoolConnection } from "mysql2/promise";
import { pool } from "../../core/config/database.config.js";
import type { ImageRow } from "../../shared/types/database.types.js";
import type { Image } from "../../shared/types/common.types.js";
import { AppError } from "../../core/middlewares/error.middleware.js";

interface SortOrderResult extends RowDataPacket {
  next_order: number;
}

interface CreateImageDTO {
  url: string;
  alt_text?: string;
  entity_type: "product" | "user" | "store";
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
  private getDb(conn?: PoolConnection) {
    return conn || pool;
  }

  async getByEntity(entityType: "product" | "user" | "store", entityId: number, conn?: PoolConnection): Promise<Image[]> {
    const [images] = await this.getDb(conn).query<ImageRow[]>(
      "SELECT * FROM images WHERE entity_type = ? AND entity_id = ? ORDER BY is_primary DESC, sort_order ASC",
      [entityType, entityId]
    );
    return images;
  }

  async getById(imageId: number, conn?: PoolConnection): Promise<Image | null> {
    const [images] = await this.getDb(conn).query<ImageRow[]>("SELECT * FROM images WHERE id = ?", [imageId]);
    return images[0] || null;
  }

  async getPrimaryImage(entityType: "product" | "user" | "store", entityId: number, conn?: PoolConnection): Promise<Image | null> {
    const [images] = await this.getDb(conn).query<ImageRow[]>(
      "SELECT * FROM images WHERE entity_type = ? AND entity_id = ? AND is_primary = TRUE LIMIT 1",
      [entityType, entityId]
    );
    return images[0] || null;
  }

  async getPrimaryImagesForEntities(entityType: "product" | "user" | "store", entityIds: number[], conn?: PoolConnection): Promise<Map<number, string>> {
    if (entityIds.length === 0) return new Map();
    const placeholders = entityIds.map(() => "?").join(",");
    const [images] = await this.getDb(conn).query<ImageRow[]>(
      `SELECT entity_id, url FROM images WHERE entity_type = ? AND entity_id IN (${placeholders}) AND is_primary = TRUE`,
      [entityType, ...entityIds]
    );
    const imageMap = new Map<number, string>();
    images.forEach(img => imageMap.set(img.entity_id, img.url));
    return imageMap;
  }

  async create(data: CreateImageDTO, conn?: PoolConnection): Promise<Image> {
    const db = this.getDb(conn);
    if (data.is_primary) {
      await db.query("UPDATE images SET is_primary = FALSE WHERE entity_type = ? AND entity_id = ?", [data.entity_type, data.entity_id]);
    }

    let sortOrder = data.sort_order;
    if (sortOrder === undefined) {
      const [result] = await db.query<SortOrderResult[]>(
        "SELECT COALESCE(MAX(sort_order), -1) + 1 as next_order FROM images WHERE entity_type = ? AND entity_id = ?",
        [data.entity_type, data.entity_id]
      );
      sortOrder = result[0].next_order;
    }

    const [result] = await db.query<ResultSetHeader>(
      "INSERT INTO images (url, alt_text, entity_type, entity_id, is_primary, sort_order) VALUES (?, ?, ?, ?, ?, ?)",
      [data.url, data.alt_text || null, data.entity_type, data.entity_id, data.is_primary || false, sortOrder]
    );

    const [images] = await db.query<ImageRow[]>("SELECT * FROM images WHERE id = ?", [result.insertId]);
    return images[0];
  }

  async createMany(images: CreateImageDTO[], conn?: PoolConnection): Promise<Image[]> {
    if (images.length === 0) return [];
    const created: Image[] = [];
    for (const imageData of images) created.push(await this.create(imageData, conn));
    return created;
  }

  async update(imageId: number, data: UpdateImageDTO, conn?: PoolConnection): Promise<Image> {
    const db = this.getDb(conn);
    const [existing] = await db.query<ImageRow[]>("SELECT * FROM images WHERE id = ?", [imageId]);
    if (existing.length === 0) throw new AppError("Image tidak ditemukan", 404);

    if (data.is_primary) {
      await db.query("UPDATE images SET is_primary = FALSE WHERE entity_type = ? AND entity_id = ? AND id != ?", [existing[0].entity_type, existing[0].entity_id, imageId]);
    }

    const fields: string[] = [];
    const values: any[] = [];
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) { fields.push(`${key} = ?`); values.push(value); }
    });

    if (fields.length > 0) {
      values.push(imageId);
      await db.query(`UPDATE images SET ${fields.join(", ")} WHERE id = ?`, values);
    }

    const [updated] = await db.query<ImageRow[]>("SELECT * FROM images WHERE id = ?", [imageId]);
    return updated[0];
  }

  async setPrimary(imageId: number, conn?: PoolConnection): Promise<Image> {
    const db = this.getDb(conn);
    const [existing] = await db.query<ImageRow[]>("SELECT * FROM images WHERE id = ?", [imageId]);
    if (existing.length === 0) throw new AppError("Image tidak ditemukan", 404);

    await db.query("UPDATE images SET is_primary = FALSE WHERE entity_type = ? AND entity_id = ?", [existing[0].entity_type, existing[0].entity_id]);
    await db.query("UPDATE images SET is_primary = TRUE WHERE id = ?", [imageId]);

    const [updated] = await db.query<ImageRow[]>("SELECT * FROM images WHERE id = ?", [imageId]);
    return updated[0];
  }

  async delete(imageId: number, conn?: PoolConnection): Promise<void> {
    const db = this.getDb(conn);
    const [existing] = await db.query<ImageRow[]>("SELECT * FROM images WHERE id = ?", [imageId]);
    if (existing.length === 0) throw new AppError("Image tidak ditemukan", 404);

    await db.query("DELETE FROM images WHERE id = ?", [imageId]);
    if (existing[0].is_primary) {
      await db.query("UPDATE images SET is_primary = TRUE WHERE entity_type = ? AND entity_id = ? ORDER BY sort_order ASC LIMIT 1", [existing[0].entity_type, existing[0].entity_id]);
    }
  }

  async deleteByEntity(entityType: "product" | "user" | "store", entityId: number, conn?: PoolConnection): Promise<void> {
    await this.getDb(conn).query("DELETE FROM images WHERE entity_type = ? AND entity_id = ?", [entityType, entityId]);
  }

  async reorder(entityType: "product" | "user" | "store", entityId: number, imageIds: number[], conn?: PoolConnection): Promise<void> {
    const db = this.getDb(conn);
    for (let i = 0; i < imageIds.length; i++) {
      await db.query("UPDATE images SET sort_order = ? WHERE id = ? AND entity_type = ? AND entity_id = ?", [i, imageIds[i], entityType, entityId]);
    }
  }
}
