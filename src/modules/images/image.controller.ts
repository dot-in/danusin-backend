import type { Request, Response, NextFunction } from "express";
import { ImageService } from "./image.service.js";
import { successResponse } from "../../shared/utils/response.util.js";
import { AppError } from "../../core/middlewares/error.middleware.js";

export class ImageController {
  private imageService = new ImageService();

  getByEntity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { entity_type, entity_id } = req.query;
      const images = await this.imageService.getByEntity(entity_type as any, Number(entity_id));
      successResponse(res, 200, "Berhasil mengambil gambar", { images });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const image = await this.imageService.getById(Number(req.params.id));
      if (!image) throw new AppError("Image tidak ditemukan", 404);
      successResponse(res, 200, "Berhasil mengambil gambar", { image });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const image = await this.imageService.create(req.body);
      successResponse(res, 201, "Gambar berhasil ditambahkan", { image });
    } catch (error) {
      next(error);
    }
  };

  bulkCreate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { images: inputImages, entity_type, entity_id } = req.body;
      const imageData = inputImages.map((img: any, index: number) => ({
        ...img,
        entity_type,
        entity_id,
        is_primary: img.is_primary || index === 0,
        sort_order: index,
      }));
      const images = await this.imageService.createMany(imageData);
      successResponse(res, 201, "Gambar berhasil ditambahkan", { images });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const image = await this.imageService.update(Number(req.params.id), req.body);
      successResponse(res, 200, "Gambar berhasil diupdate", { image });
    } catch (error) {
      next(error);
    }
  };

  setPrimary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const image = await this.imageService.setPrimary(Number(req.params.id));
      successResponse(res, 200, "Gambar utama berhasil diubah", { image });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.imageService.delete(Number(req.params.id));
      successResponse(res, 200, "Gambar berhasil dihapus");
    } catch (error) {
      next(error);
    }
  };

  reorder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { entity_type, entity_id, image_ids } = req.body;
      await this.imageService.reorder(entity_type, entity_id, image_ids);
      successResponse(res, 200, "Urutan gambar berhasil diubah");
    } catch (error) {
      next(error);
    }
  };
}
