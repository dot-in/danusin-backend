import { ResultSetHeader } from "mysql2";
import { pool } from "../../core/config/database.config.js";
import { AppError } from "../../core/middlewares/error.middleware.js";
import { ProductRow } from "../../shared/types/database.types.js";
import { Product } from "../../shared/types/common.types.js";
import { ERROR_MESSAGES } from "../../shared/constants/message.constant.js";

interface CreateProductDTO {
  name: string;
  description: string;
  price: number;
  image_url?: string;
  po_open_date: string;
  po_close_date: string;
  delivery_date?: string;
}

interface UpdateProductDTO {
  name?: string;
  description?: string;
  price?: number;
  image_url?: string;
  po_open_date?: string;
  po_close_date?: string;
  delivery_date?: string | null;
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
  async getAll(
    query: GetProductsQuery
  ): Promise<{ products: Product[]; total: number }> {
    const {
      q,
      min_price,
      max_price,
      open_only,
      seller_id,
      page = 1,
      limit = 20,
    } = query;

    let whereConditions: string[] = [];
    let queryParams: any[] = [];

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
      whereConditions.push(
        "p.po_open_date <= CURDATE() AND p.po_close_date >= CURDATE()"
      );
    }

    if (seller_id) {
      whereConditions.push("p.seller_id = ?");
      queryParams.push(seller_id);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    const [countResult] = await pool.query<any[]>(
      `SELECT COUNT(*) as total FROM products p ${whereClause}`,
      queryParams
    );
    const total = countResult[0].total;

    const offset = (page - 1) * limit;
    const [products] = await pool.query<ProductRow[]>(
      `SELECT 
        p.*,
        u.name as seller_name,
        u.faculty as seller_faculty
       FROM products p
       LEFT JOIN users u ON p.seller_id = u.id
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    return { products, total };
  }

  async getById(
    productId: number
  ): Promise<Product & { seller_name: string; seller_faculty: string }> {
    const [products] = await pool.query<ProductRow[]>(
      `SELECT 
        p.*,
        u.name as seller_name,
        u.faculty as seller_faculty,
        u.whatsapp as seller_whatsapp
       FROM products p
       LEFT JOIN users u ON p.seller_id = u.id
       WHERE p.id = ?`,
      [productId]
    );

    if (products.length === 0) {
      throw new AppError(ERROR_MESSAGES.PRODUCT.NOT_FOUND, 404);
    }

    return products[0] as any;
  }

  async getMySeller(sellerId: number): Promise<Product[]> {
    const [products] = await pool.query<ProductRow[]>(
      `SELECT * FROM products WHERE seller_id = ? ORDER BY created_at DESC`,
      [sellerId]
    );

    return products;
  }

  async create(
    sellerId: number,
    productData: CreateProductDTO
  ): Promise<Product> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO products (seller_id, name, description, price, image_url, po_open_date, po_close_date, delivery_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sellerId,
        productData.name,
        productData.description,
        productData.price,
        productData.image_url || null,
        productData.po_open_date,
        productData.po_close_date,
        productData.delivery_date || null,
      ]
    );

    const [products] = await pool.query<ProductRow[]>(
      "SELECT * FROM products WHERE id = ?",
      [result.insertId]
    );

    return products[0];
  }

  async update(
    productId: number,
    sellerId: number,
    updateData: UpdateProductDTO
  ): Promise<Product> {
    const [products] = await pool.query<ProductRow[]>(
      "SELECT seller_id FROM products WHERE id = ?",
      [productId]
    );

    if (products.length === 0) {
      throw new AppError(ERROR_MESSAGES.PRODUCT.NOT_FOUND, 404);
    }

    if (products[0].seller_id !== sellerId) {
      throw new AppError(ERROR_MESSAGES.PRODUCT.NOT_OWNER, 403);
    }

    const fields: string[] = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) {
      throw new AppError("Tidak ada data yang diupdate", 400);
    }

    values.push(productId);

    await pool.query(
      `UPDATE products SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    const [updatedProducts] = await pool.query<ProductRow[]>(
      "SELECT * FROM products WHERE id = ?",
      [productId]
    );

    return updatedProducts[0];
  }

  async delete(productId: number, sellerId: number): Promise<void> {
    const [products] = await pool.query<ProductRow[]>(
      "SELECT seller_id FROM products WHERE id = ?",
      [productId]
    );

    if (products.length === 0) {
      throw new AppError(ERROR_MESSAGES.PRODUCT.NOT_FOUND, 404);
    }

    if (products[0].seller_id !== sellerId) {
      throw new AppError(ERROR_MESSAGES.PRODUCT.NOT_OWNER, 403);
    }

    await pool.query("DELETE FROM products WHERE id = ?", [productId]);
  }
}
