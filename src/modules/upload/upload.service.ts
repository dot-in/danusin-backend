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
  private frontendDir: string;
  private maxSize: number;
  private allowedExtensions: string[];
  // [NEW] Tambahkan properti Base URL Backend
  private backendUrl: string;

  constructor() {
    this.uploadDir = config.upload.dir;
    this.maxSize = config.upload.maxSize;
    this.allowedExtensions = config.upload.allowedExtensions;
    this.frontendDir = path.resolve(process.cwd(), "../danusin-frontend/public/uploads");

    // [NEW] Set URL Backend (Hardcode port 3001 sesuai permintaan)
    // Di production sebaiknya ambil dari env, misal: config.app.url
    this.backendUrl = "http://localhost:3001";
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

    await Promise.all([
        fs.mkdir(this.uploadDir, { recursive: true }),
        fs.mkdir(this.frontendDir, { recursive: true })
    ]);

    const ext = path.extname(file.name);
    const filename = `${crypto.randomUUID()}${ext}`;

    const backendPath = path.join(this.uploadDir, filename);
    const frontendPath = path.join(this.frontendDir, filename);

    await Promise.all([
        fs.writeFile(backendPath, file.data),
        fs.writeFile(frontendPath, file.data)
    ]);

    return `${this.backendUrl}/uploads/${filename}`;
  }

  async deleteImage(imageUrl: string): Promise<void> {
    try {
      // [MODIFIED] Cara mengambil filename jika inputnya berupa URL lengkap
      // Jika imageUrl = "http://localhost:3001/uploads/gambar.jpg"
      // Maka kita perlu mengambil bagian terakhir setelah slash "/"
      const filename = imageUrl.split('/').pop();

      if (!filename) return; // Guard clause jika filename kosong

      const backendPath = path.join(this.uploadDir, filename);
      const frontendPath = path.join(this.frontendDir, filename);

      await Promise.allSettled([
        fs.unlink(backendPath),
        fs.unlink(frontendPath)
      ]);
    } catch (error) {}
  }
}
