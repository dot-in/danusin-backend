import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../../core/config/database.config.js";
import { AppError } from "../../core/middlewares/error.middleware.js";
import type { ProductRow } from "../../shared/types/database.types.js";
import type { Product, Image } from "../../shared/types/common.types.js";
import { ERROR_MESSAGES } from "../../shared/constants/message.constant.js";
import { ImageService } from "../images/image.service.js";
import { getAvailableDays } from "../../shared/utils/date.util.js";

const imageService = new ImageService();

interface CountResult extends RowDataPacket {
  total: number;
}
type QueryParamValue = string | number | boolean | null;

interface CreateProductDTO {
  name: string;
  description: string;
  price: number;
  stock?: number;
  po_open_date: string;
  po_close_date: string;
  delivery_date?: string;
  images?: string[];
}

interface UpdateProductDTO {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  po_open_date?: string;
  po_close_date?: string;
  delivery_date?: string | null;
  images?: string[];
  add_images?: string[];
  remove_image_ids?: number[];
}

interface GetProductsQuery {
  q?: string;
  min_price?: number;
  max_price?: number;
  open_only?: boolean;
  seller_id?: number;
  page?: number;
  limit?: number;
}

export class ProductService {
  async getAll(query: GetProductsQuery): Promise<{
    products: Product[];
    total: number;
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const { q, min_price, max_price, open_only, seller_id, page = 1, limit = 20 } = query;
    const whereConditions: string[] = [];
    const queryParams: QueryParamValue[] = [];

    if (q) {
      whereConditions.push("(p.name LIKE ? OR p.description LIKE ?)");
      queryParams.push(`%${q}%`, `%${q}%`);
    }
    if (min_price !== undefined) {
      whereConditions.push("p.price >= ?");
      queryParams.push(min_price);
    }
    if (max_price !== undefined) {
      whereConditions.push("p.price <= ?");
      queryParams.push(max_price);
    }
    if (open_only) {
      whereConditions.push("p.po_open_date <= CURDATE() AND p.po_close_date >= CURDATE()");
    }
    if (seller_id) {
      whereConditions.push("p.seller_id = ?");
      queryParams.push(seller_id);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    const [countResult] = await pool.query<CountResult[]>(
      `SELECT COUNT(*) as total FROM products p ${whereClause}`,
      queryParams
    );
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    const [products] = await pool.query<(ProductRow & { primary_image: string | null; seller_name: string; seller_faculty: string; seller_whatsapp: string })[]>(
      `SELECT p.*, 
        u.name as seller_name, u.faculty as seller_faculty, u.whatsapp as seller_whatsapp,
        i.url as primary_image
       FROM products p
       LEFT JOIN users u ON p.seller_id = u.id
       LEFT JOIN images i ON i.entity_type = 'product' AND i.entity_id = p.id AND i.is_primary = TRUE
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    const formattedProducts: Product[] = products.map((p) => ({
      ...p,
      available_days: getAvailableDays(p.po_open_date, p.po_close_date),
    }));

    return {
      products: formattedProducts,
      total,
      meta: { page, limit, total, totalPages },
    };
  }

  async getById(productId: number): Promise<Product> {
    const [products] = await pool.query<(ProductRow & { seller_name: string; seller_faculty: string; seller_whatsapp: string })[]>(
      `SELECT p.*, u.name as seller_name, u.faculty as seller_faculty, u.whatsapp as seller_whatsapp
       FROM products p
       LEFT JOIN users u ON p.seller_id = u.id
       WHERE p.id = ?`,
      [productId]
    );

    if (products.length === 0) throw new AppError(ERROR_MESSAGES.PRODUCT.NOT_FOUND, 404);

    const images = await imageService.getByEntity("product", productId);
    const primaryImage = images.find((img) => img.is_primary) || images[0];

    return {
      ...products[0],
      images,
      primary_image: primaryImage?.url || null,
      available_days: getAvailableDays(products[0].po_open_date, products[0].po_close_date),
    };
  }

  async getMySeller(sellerId: number): Promise<Product[]> {
    const [products] = await pool.query<(ProductRow & { primary_image: string | null })[]>(
      `SELECT p.*, i.url as primary_image
       FROM products p
       LEFT JOIN images i ON i.entity_type = 'product' AND i.entity_id = p.id AND i.is_primary = TRUE
       WHERE p.seller_id = ? 
       ORDER BY p.created_at DESC`,
      [sellerId]
    );

    return products.map((p) => ({
      ...p,
      available_days: getAvailableDays(p.po_open_date, p.po_close_date),
    }));
  }

  async create(sellerId: number, data: CreateProductDTO): Promise<Product> {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [result] = await conn.query<ResultSetHeader>(
        `INSERT INTO products (seller_id, name, description, price, stock, po_open_date, po_close_date, delivery_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [sellerId, data.name, data.description, data.price, data.stock || 0, data.po_open_date, data.po_close_date, data.delivery_date || null]
      );

      const productId = result.insertId;

      if (data.images?.length) {
        const imageData = data.images.map((url, index) => ({
          url,
          entity_type: "product" as const,
          entity_id: productId,
          is_primary: index === 0,
          sort_order: index,
        }));
        await imageService.createMany(imageData, conn);
      }

      await conn.commit();
      return this.getById(productId);
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  async update(productId: number, sellerId: number, data: UpdateProductDTO): Promise<Product> {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [products] = await conn.query<ProductRow[]>("SELECT seller_id FROM products WHERE id = ? FOR UPDATE", [productId]);
      if (products.length === 0) throw new AppError(ERROR_MESSAGES.PRODUCT.NOT_FOUND, 404);
      if (products[0].seller_id !== sellerId) throw new AppError(ERROR_MESSAGES.PRODUCT.NOT_OWNER, 403);

      const { images, add_images, remove_image_ids, ...productData } = data;
      const fields: string[] = [];
      const values: QueryParamValue[] = [];

      for (const [key, value] of Object.entries(productData)) {
        if (value !== undefined) {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      }

      if (fields.length > 0) {
        values.push(productId);
        await conn.query(`UPDATE products SET ${fields.join(", ")} WHERE id = ?`, values);
      }

      if (images !== undefined) {
        await imageService.deleteByEntity("product", productId, conn);
        if (images.length > 0) {
          const imageData = images.map((url, index) => ({
            url,
            entity_type: "product" as const,
            entity_id: productId,
            is_primary: index === 0,
            sort_order: index,
          }));
          await imageService.createMany(imageData, conn);
        }
      }

      if (add_images?.length) {
        const existingImages = await imageService.getByEntity("product", productId, conn);
        const imageData = add_images.map((url, index) => ({
          url,
          entity_type: "product" as const,
          entity_id: productId,
          is_primary: existingImages.length === 0 && index === 0,
          sort_order: existingImages.length + index,
        }));
        await imageService.createMany(imageData, conn);
      }

      if (remove_image_ids?.length) {
        for (const imageId of remove_image_ids) {
          await imageService.delete(imageId, conn);
        }
      }

      await conn.commit();
      return this.getById(productId);
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  async delete(productId: number, sellerId: number): Promise<void> {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [products] = await conn.query<ProductRow[]>("SELECT seller_id FROM products WHERE id = ? FOR UPDATE", [productId]);
      if (products.length === 0) throw new AppError(ERROR_MESSAGES.PRODUCT.NOT_FOUND, 404);
      if (products[0].seller_id !== sellerId) throw new AppError(ERROR_MESSAGES.PRODUCT.NOT_OWNER, 403);

      await imageService.deleteByEntity("product", productId, conn);
      await conn.query("DELETE FROM products WHERE id = ?", [productId]);

      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }
}
