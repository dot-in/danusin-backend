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
  private uploadDir = config.upload.dir;
  private frontendDir = path.resolve(process.cwd(), "../danusin-frontend/public/uploads");
  private maxSize = config.upload.maxSize;
  private allowedExtensions = config.upload.allowedExtensions;
  private backendUrl = `http://localhost:${config.server.port}`;

  async uploadImage(file: UploadedFile): Promise<string> {
    if (!file) throw new AppError(ERROR_MESSAGES.UPLOAD.NO_FILE, 400);
    if (file.size > this.maxSize) throw new AppError(`${ERROR_MESSAGES.UPLOAD.FILE_TOO_LARGE} (Max: ${this.maxSize / 1024 / 1024}MB)`, 400);
    if (!isValidImageExtension(file.name, this.allowedExtensions)) {
      throw new AppError(`${ERROR_MESSAGES.UPLOAD.INVALID_TYPE}. Allowed: ${this.allowedExtensions.join(", ")}`, 400);
    }

    await Promise.all([fs.mkdir(this.uploadDir, { recursive: true }), fs.mkdir(this.frontendDir, { recursive: true })]);

    const filename = `${crypto.randomUUID()}${path.extname(file.name)}`;
    await Promise.all([
      fs.writeFile(path.join(this.uploadDir, filename), file.data),
      fs.writeFile(path.join(this.frontendDir, filename), file.data),
    ]);

    return `${this.backendUrl}/uploads/${filename}`;
  }

  async deleteImage(imageUrl: string): Promise<void> {
    const filename = imageUrl.split("/").pop();
    if (!filename) return;
    await Promise.allSettled([
      fs.unlink(path.join(this.uploadDir, filename)),
      fs.unlink(path.join(this.frontendDir, filename)),
    ]);
  }
}
