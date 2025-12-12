import type { Request, Response, NextFunction } from "express";
import { ImageService } from "./image.service.js";
import {
  createImageSchema,
  updateImageSchema,
  getImagesQuerySchema,
  reorderImagesSchema,
  bulkCreateImagesSchema,
} from "./image.validation.js";

const imageService = new ImageService();

export class ImageController {
  /**
   * Get images by entity
   */
  async getByEntity(req: Request, res: Response, next: NextFunction) {
    try {
      const query = getImagesQuerySchema. parse({
        entity_type: req.query. entity_type,
        entity_id: req.query. entity_id,
      });

      const images = await imageService.getByEntity(query. entity_type, query.entity_id);

      res.json({
        message: "Berhasil mengambil gambar",
        data: { images },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get image by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const imageId = Number(req.params. id);
      const image = await imageService.getById(imageId);

      if (! image) {
        return res.status(404).json({
          message: "Image tidak ditemukan",
        });
      }

      res. json({
        message: "Berhasil mengambil gambar",
        data: { image },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new image
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createImageSchema. parse(req.body);
      const image = await imageService.create(data);

      res.status(201). json({
        message: "Gambar berhasil ditambahkan",
        data: { image },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk create images
   */
  async bulkCreate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bulkCreateImagesSchema.parse(req.body);

      const imageData = data.images. map((img, index) => ({
        url: img.url,
        alt_text: img.alt_text,
        entity_type: data.entity_type,
        entity_id: data.entity_id,
        is_primary: img.is_primary || index === 0,
        sort_order: index,
      }));

      const images = await imageService. createMany(imageData);

      res. status(201).json({
        message: "Gambar berhasil ditambahkan",
        data: { images },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update image
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const imageId = Number(req.params.id);
      const data = updateImageSchema.parse(req.body);
      const image = await imageService.update(imageId, data);

      res.json({
        message: "Gambar berhasil diupdate",
        data: { image },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Set primary image
   */
  async setPrimary(req: Request, res: Response, next: NextFunction) {
    try {
      const imageId = Number(req. params.id);
      const image = await imageService.setPrimary(imageId);

      res.json({
        message: "Gambar utama berhasil diubah",
        data: { image },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete image
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const imageId = Number(req.params. id);
      await imageService.delete(imageId);

      res.json({
        message: "Gambar berhasil dihapus",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reorder images
   */
  async reorder(req: Request, res: Response, next: NextFunction) {
    try {
      const data = reorderImagesSchema.parse(req.body);
      await imageService.reorder(data.entity_type, data.entity_id, data. image_ids);

      res.json({
        message: "Urutan gambar berhasil diubah",
      });
    } catch (error) {
      next(error);
    }
  }
}
