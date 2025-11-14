import pool from "../config/db.js";
import type { Product } from "../types/entities.js";
import { AppError } from "../utils/errors.js";

interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  po_open_date: string;
  po_close_date: string;
  delivery_date: string;
}

export async function createProduct(
  sellerId: number,
  data: CreateProductInput
) {
  const {
    name,
    description,
    price,
    image_url,
    po_open_date,
    po_close_date,
    delivery_date,
  } = data;

  const [result] = await pool.query(
    `INSERT INTO products (seller_id, name, description, price, image_url, po_open_date, po_close_date, delivery_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      sellerId,
      name,
      description ?? null,
      price,
      image_url ?? null,
      po_open_date,
      po_close_date,
      delivery_date,
    ]
  );
  return { id: (result as any).insertId };
}

export async function updateProduct(
  sellerId: number,
  productId: number | string,
  data: Partial<Product>
) {
  const [rows] = await pool.query(
    "SELECT id, seller_id FROM products WHERE id = ?",
    [productId]
  );
  const arr = rows as any[];
  if (!arr.length) throw new AppError("Produk tidak ditemukan", 404);
  if (arr[0].seller_id !== sellerId)
    throw new AppError("Tidak boleh mengubah produk orang lain", 403);

  const fields: string[] = [];
  const values: any[] = [];
  Object.entries(data).forEach(([k, v]) => {
    if (v !== undefined) {
      fields.push(`${k}=?`);
      values.push(v);
    }
  });
  if (!fields.length) return { message: "Tidak ada perubahan" };
  values.push(productId);
  await pool.query(
    `UPDATE products SET ${fields.join(", ")} WHERE id=?`,
    values
  );
  return { message: "Berhasil update" };
}

export async function deleteProduct(
  sellerId: number,
  productId: number | string
) {
  const [rows] = await pool.query(
    "SELECT seller_id FROM products WHERE id = ?",
    [productId]
  );
  const arr = rows as any[];
  if (!arr.length) throw new AppError("Produk tidak ditemukan", 404);
  if (arr[0].seller_id !== sellerId)
    throw new AppError("Tidak boleh menghapus produk orang lain", 403);
  await pool.query("DELETE FROM products WHERE id = ?", [productId]);
  return { message: "Berhasil hapus" };
}

export async function getProduct(productId: number | string) {
  const [rows] = await pool.query(
    `SELECT p.*, u.name as seller_name
     FROM products p
     JOIN users u ON p.seller_id = u.id
     WHERE p.id = ?`,
    [productId]
  );
  const arr = rows as any[];
  if (!arr.length) throw new AppError("Produk tidak ditemukan", 404);
  return arr[0];
}

interface ListProductsFilter {
  q?: string;
  min_price?: string;
  max_price?: string;
  open_only?: string;
}

export async function listProducts(filter: ListProductsFilter) {
  const { q, min_price, max_price, open_only } = filter;
  const conditions: string[] = [];
  const params: any[] = [];

  if (q) {
    conditions.push("(p.name LIKE ? OR p.description LIKE ?)");
    params.push(`%${q}%`, `%${q}%`);
  }
  if (min_price) {
    conditions.push("p.price >= ?");
    params.push(Number(min_price));
  }
  if (max_price) {
    conditions.push("p.price <= ?");
    params.push(Number(max_price));
  }
  if (open_only === "true") {
    conditions.push("CURDATE() BETWEEN p.po_open_date AND p.po_close_date");
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [rows] = await pool.query(
    `SELECT p.id, p.name, p.price, p.image_url, p.po_open_date, p.po_close_date, p.delivery_date,
            u.name as seller_name
     FROM products p
     JOIN users u ON p.seller_id = u.id
     ${where}
     ORDER BY p.created_at DESC`,
    params
  );
  return rows;
}

export async function listSellerProducts(sellerId: number) {
  const [rows] = await pool.query(
    `SELECT id, name, price, po_open_date, po_close_date, delivery_date, created_at
     FROM products WHERE seller_id = ? ORDER BY created_at DESC`,
    [sellerId]
  );
  return rows;
}
