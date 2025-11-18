import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { config } from "../../core/config/env.config.js";
import { AppError } from "../../core/middlewares/error.middleware.js";
import { ERROR_MESSAGES } from "../../shared/constants/message.constant.js";
import { isValidImageExtension } from "../../shared/utils/validator.util.js";

interface UploadedFile {
  name: string;
  data: Buffer;
  size: number;
  mimetype: string;
}

export class UploadService {
  private uploadDir: string;
  private maxSize: number;
  private allowedExtensions: string[];

  constructor() {
    this.uploadDir = config.upload.dir;
    this.maxSize = config.upload.maxSize;
    this.allowedExtensions = config.upload.allowedExtensions;
  }

  async uploadImage(file: UploadedFile): Promise<string> {
    if (!file) {
      throw new AppError(ERROR_MESSAGES.UPLOAD.NO_FILE, 400);
    }

    if (file.size > this.maxSize) {
      throw new AppError(
        `${ERROR_MESSAGES.UPLOAD.FILE_TOO_LARGE} (Max: ${
          this.maxSize / 1024 / 1024
        }MB)`,
        400
      );
    }

    if (!isValidImageExtension(file.name, this.allowedExtensions)) {
      throw new AppError(
        `${
          ERROR_MESSAGES.UPLOAD.INVALID_TYPE
        }. Allowed: ${this.allowedExtensions.join(", ")}`,
        400
      );
    }

    await fs.mkdir(this.uploadDir, { recursive: true });

    const ext = path.extname(file.name);
    const filename = `${crypto.randomUUID()}${ext}`;
    const filepath = path.join(this.uploadDir, filename);

    await fs.writeFile(filepath, file.data);

    return `/uploads/${filename}`;
  }

  async deleteImage(imageUrl: string): Promise<void> {
    try {
      const filename = path.basename(imageUrl);
      const filepath = path.join(this.uploadDir, filename);
      await fs.unlink(filepath);
    } catch (error) {}
  }
}
