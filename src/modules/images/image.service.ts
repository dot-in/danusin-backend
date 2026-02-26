import type { ResultSetHeader, RowDataPacket } from "mysql2";
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
  /**
   * Get all images for a specific entity
   */
  async getByEntity(
    entityType: "product" | "user" | "store",
    entityId: number,
  ): Promise<Image[]> {
    const [images] = await pool.query<ImageRow[]>(
      `SELECT * FROM images
       WHERE entity_type = ?  AND entity_id = ?
       ORDER BY is_primary DESC, sort_order ASC`,
      [entityType, entityId],
    );
    return images;
  }

  /**
   * Get image by ID
   */
  async getById(imageId: number): Promise<Image | null> {
    const [images] = await pool.query<ImageRow[]>(
      "SELECT * FROM images WHERE id = ?",
      [imageId],
    );
    return images[0] || null;
  }

  /**
   * Get primary image for an entity
   */
  async getPrimaryImage(
    entityType: "product" | "user" | "store",
    entityId: number,
  ): Promise<Image | null> {
    const [images] = await pool.query<ImageRow[]>(
      `SELECT * FROM images
       WHERE entity_type = ? AND entity_id = ? AND is_primary = TRUE
       LIMIT 1`,
      [entityType, entityId],
    );
    return images[0] || null;
  }

  /**
   * Get primary images for multiple entities (batch)
   */
  async getPrimaryImagesForEntities(
    entityType: "product" | "user" | "store",
    entityIds: number[],
  ): Promise<Map<number, string>> {
    if (entityIds.length === 0) return new Map();

    const placeholders = entityIds.map(() => "? ").join(",");
    const [images] = await pool.query<ImageRow[]>(
      `SELECT entity_id, url FROM images
       WHERE entity_type = ?  AND entity_id IN (${placeholders}) AND is_primary = TRUE`,
      [entityType, ...entityIds],
    );

    const imageMap = new Map<number, string>();
    for (const img of images) {
      imageMap.set(img.entity_id, img.url);
    }
    return imageMap;
  }

  /**
   * Create new image
   */
  async create(data: CreateImageDTO): Promise<Image> {
    // Jika is_primary = true, set semua image lain jadi false
    if (data.is_primary) {
      await pool.query(
        `UPDATE images SET is_primary = FALSE
         WHERE entity_type = ? AND entity_id = ?`,
        [data.entity_type, data.entity_id],
      );
    }

    // Hitung sort_order jika tidak diberikan
    let sortOrder = data.sort_order;
    if (sortOrder === undefined) {
      const [result] = await pool.query<SortOrderResult[]>(
        `SELECT COALESCE(MAX(sort_order), -1) + 1 as next_order
         FROM images WHERE entity_type = ? AND entity_id = ?`,
        [data.entity_type, data.entity_id],
      );
      sortOrder = result[0].next_order;
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO images (url, alt_text, entity_type, entity_id, is_primary, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.url,
        data.alt_text || null,
        data.entity_type,
        data.entity_id,
        data.is_primary || false,
        sortOrder,
      ],
    );

    const [images] = await pool.query<ImageRow[]>(
      "SELECT * FROM images WHERE id = ?",
      [result.insertId],
    );

    return images[0];
  }

  /**
   * Create multiple images at once
   */
  async createMany(images: CreateImageDTO[]): Promise<Image[]> {
    if (images.length === 0) return [];

    const createdImages: Image[] = [];
    for (const imageData of images) {
      const image = await this.create(imageData);
      createdImages.push(image);
    }
    return createdImages;
  }

  /**
   * Update image
   */
  async update(imageId: number, data: UpdateImageDTO): Promise<Image> {
    const [existing] = await pool.query<ImageRow[]>(
      "SELECT * FROM images WHERE id = ?",
      [imageId],
    );

    if (existing.length === 0) {
      throw new AppError("Image tidak ditemukan", 404);
    }

    // Jika set as primary, unset yang lain
    if (data.is_primary) {
      await pool.query(
        `UPDATE images SET is_primary = FALSE
         WHERE entity_type = ? AND entity_id = ?  AND id != ?`,
        [existing[0].entity_type, existing[0].entity_id, imageId],
      );
    }

    const fields: string[] = [];
    const values: (string | number | boolean)[] = [];

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        fields.push(`${key} = ? `);
        values.push(value);
      }
    }

    if (fields.length > 0) {
      values.push(imageId);
      await pool.query(
        `UPDATE images SET ${fields.join(", ")} WHERE id = ? `,
        values,
      );
    }

    const [updated] = await pool.query<ImageRow[]>(
      "SELECT * FROM images WHERE id = ?",
      [imageId],
    );

    return updated[0];
  }

  /**
   * Set primary image
   */
  async setPrimary(imageId: number): Promise<Image> {
    const [existing] = await pool.query<ImageRow[]>(
      "SELECT * FROM images WHERE id = ?",
      [imageId],
    );

    if (existing.length === 0) {
      throw new AppError("Image tidak ditemukan", 404);
    }

    // Unset semua primary untuk entity ini
    await pool.query(
      `UPDATE images SET is_primary = FALSE
       WHERE entity_type = ? AND entity_id = ? `,
      [existing[0].entity_type, existing[0].entity_id],
    );

    // Set image ini sebagai primary
    await pool.query("UPDATE images SET is_primary = TRUE WHERE id = ?", [
      imageId,
    ]);

    const [updated] = await pool.query<ImageRow[]>(
      "SELECT * FROM images WHERE id = ?",
      [imageId],
    );

    return updated[0];
  }

  /**
   * Delete image
   */
  async delete(imageId: number): Promise<void> {
    const [existing] = await pool.query<ImageRow[]>(
      "SELECT * FROM images WHERE id = ?",
      [imageId],
    );

    if (existing.length === 0) {
      throw new AppError("Image tidak ditemukan", 404);
    }

    await pool.query("DELETE FROM images WHERE id = ?", [imageId]);

    // Jika yang dihapus adalah primary, set image pertama jadi primary
    if (existing[0].is_primary) {
      await pool.query(
        `UPDATE images SET is_primary = TRUE
         WHERE entity_type = ? AND entity_id = ?
         ORDER BY sort_order ASC LIMIT 1`,
        [existing[0].entity_type, existing[0].entity_id],
      );
    }
  }

  /**
   * Delete all images for an entity
   */
  async deleteByEntity(
    entityType: "product" | "user" | "store",
    entityId: number,
  ): Promise<void> {
    await pool.query(
      "DELETE FROM images WHERE entity_type = ? AND entity_id = ?",
      [entityType, entityId],
    );
  }

  /**
   * Reorder images
   */
  async reorder(
    entityType: "product" | "user" | "store",
    entityId: number,
    imageIds: number[],
  ): Promise<void> {
    for (let i = 0; i < imageIds.length; i++) {
      await pool.query(
        "UPDATE images SET sort_order = ? WHERE id = ? AND entity_type = ? AND entity_id = ?",
        [i, imageIds[i], entityType, entityId],
      );
    }
  }
}
