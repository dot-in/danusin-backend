import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../../core/config/database.config.js";
import { AppError } from "../../core/middlewares/error.middleware.js";
import type { ProductRow } from "../../shared/types/database.types.js";
import type { Product, Image } from "../../shared/types/common.types.js";
import { ERROR_MESSAGES } from "../../shared/constants/message.constant.js";
import { ImageService } from "../images/image.service.js";

const imageService = new ImageService();

// Interface Types
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

// Helper: Hitung available_days
function getAvailableDays(startDate: string, endDate: string): string[] {
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const availableDays = new Set<string>();
  const start = new Date(startDate);
  const end = new Date(endDate);
  const current = new Date(start);

  while (current <= end) {
    availableDays.add(days[current.getDay()]);
    current.setDate(current.getDate() + 1);
  }

  const dayOrder = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
  return dayOrder.filter((day) => availableDays.has(day));
}

export class ProductService {
  private async formatProduct(product: ProductRow, images?: Image[]): Promise<Product> {
    const productImages = images || (await imageService.getByEntity("product", product.id));
    const primaryImage = productImages.find((img) => img.is_primary) || productImages[0];

    return {
      ...product,
      images: productImages,
      primary_image: primaryImage?.url || null,
      available_days: getAvailableDays(product.po_open_date, product.po_close_date),
    };
  }

  /**
   * Get all products
   */
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

    const [products] = await pool.query<ProductRow[]>(
      `SELECT p.id, p.seller_id, p.name, p.description, p.price, p.stock,
        p.po_open_date, p.po_close_date, p.delivery_date, p.created_at, p.updated_at,
        u.name as seller_name, u.faculty as seller_faculty, u.whatsapp as seller_whatsapp
       FROM products p
       LEFT JOIN users u ON p.seller_id = u.id
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    if (products.length === 0) {
      return { products: [], total, meta: { page, limit, total, totalPages } };
    }

    const productIds = products.map((p) => p.id);
    const primaryImages = await imageService.getPrimaryImagesForEntities("product", productIds);

    const formattedProducts: Product[] = products.map((p) => ({
      ...p,
      primary_image: primaryImages.get(p.id) || null,
      available_days: getAvailableDays(p.po_open_date, p.po_close_date),
    }));

    return {
      products: formattedProducts,
      total,
      meta: { page, limit, total, totalPages },
    };
  }

  /**
   * Get product by ID
   */
  async getById(productId: number): Promise<Product> {
    const [products] = await pool.query<ProductRow[]>(
      `SELECT p.id, p.seller_id, p.name, p.description, p.price, p.stock,
        p.po_open_date, p.po_close_date, p.delivery_date, p.created_at, p.updated_at,
        u.name as seller_name, u.faculty as seller_faculty, u.whatsapp as seller_whatsapp
       FROM products p
       LEFT JOIN users u ON p.seller_id = u.id
       WHERE p.id = ?`,
      [productId]
    );

    if (products.length === 0) {
      throw new AppError(ERROR_MESSAGES.PRODUCT.NOT_FOUND, 404);
    }
    return this.formatProduct(products[0]);
  }

  /**
   * Get seller's products (My Products)
   * PERBAIKAN: Menambahkan pengecekan length dan pemetaan image yang benar
   */
  async getMySeller(sellerId: number): Promise<Product[]> {
    const [products] = await pool.query<ProductRow[]>(
      "SELECT * FROM products WHERE seller_id = ? ORDER BY created_at DESC",
      [sellerId]
    );

    // Jika tidak ada produk, return array kosong segera
    if (products.length === 0) {
      return [];
    }

    const productIds = products.map((p) => p.id);
    // Pastikan getPrimaryImagesForEntities mengembalikan Map<number, string>
    const primaryImages = await imageService.getPrimaryImagesForEntities("product", productIds);

    return products.map((p) => ({
      ...p,
      // Ambil image dari Map berdasarkan ID produk
      primary_image: primaryImages.get(p.id) || null,
      available_days: getAvailableDays(p.po_open_date, p.po_close_date),
    }));
  }

  /**
   * Create product
   */
  async create(sellerId: number, data: CreateProductDTO): Promise<Product> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO products (seller_id, name, description, price, stock, po_open_date, po_close_date, delivery_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [sellerId, data.name, data.description, data.price, data.stock || 0, data.po_open_date, data.po_close_date, data.delivery_date || null]
    );

    const productId = result.insertId;

    if (data.images && data.images.length > 0) {
      const imageData = data.images.map((url, index) => ({
        url,
        entity_type: "product" as const,
        entity_id: productId,
        is_primary: index === 0,
        sort_order: index,
      }));
      await imageService.createMany(imageData);
    }
    return this.getById(productId);
  }

  /**
   * Update product
   */
  async update(productId: number, sellerId: number, data: UpdateProductDTO): Promise<Product> {
    const [products] = await pool.query<ProductRow[]>("SELECT seller_id FROM products WHERE id = ?", [productId]);
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
      await pool.query(`UPDATE products SET ${fields.join(", ")} WHERE id = ?`, values);
    }

    // Logic Images
    if (images !== undefined) {
      await imageService.deleteByEntity("product", productId);
      if (images.length > 0) {
        const imageData = images.map((url, index) => ({
          url,
          entity_type: "product" as const,
          entity_id: productId,
          is_primary: index === 0,
          sort_order: index,
        }));
        await imageService.createMany(imageData);
      }
    }

    if (add_images && add_images.length > 0) {
      const existingImages = await imageService.getByEntity("product", productId);
      const startOrder = existingImages.length;
      const imageData = add_images.map((url, index) => ({
        url,
        entity_type: "product" as const,
        entity_id: productId,
        is_primary: existingImages.length === 0 && index === 0,
        sort_order: startOrder + index,
      }));
      await imageService.createMany(imageData);
    }

    if (remove_image_ids && remove_image_ids.length > 0) {
      for (const imageId of remove_image_ids) {
        await imageService.delete(imageId);
      }
    }

    return this.getById(productId);
  }

  /**
   * Delete product
   */
  async delete(productId: number, sellerId: number): Promise<void> {
    const [products] = await pool.query<ProductRow[]>("SELECT seller_id FROM products WHERE id = ?", [productId]);
    if (products.length === 0) throw new AppError(ERROR_MESSAGES.PRODUCT.NOT_FOUND, 404);
    if (products[0].seller_id !== sellerId) throw new AppError(ERROR_MESSAGES.PRODUCT.NOT_OWNER, 403);

    await imageService.deleteByEntity("product", productId);
    await pool.query("DELETE FROM products WHERE id = ?", [productId]);
  }
}
