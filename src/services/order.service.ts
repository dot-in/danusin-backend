import pool from "../config/db.js";
import {
  ORDER_STATUS,
  VALID_TRANSITIONS,
  OrderStatus,
} from "../constants/orderStatus.js";
import { createNotification } from "./notification.service.js";
import { AppError } from "../utils/errors.js";

interface CreateOrderInput {
  product_id: number;
  quantity: number;
}

export async function createOrder(
  buyerId: number,
  { product_id, quantity }: CreateOrderInput
) {
  const [prodRows] = await pool.query(
    "SELECT id, price, seller_id, po_open_date, po_close_date FROM products WHERE id=?",
    [product_id]
  );
  const products = prodRows as any[];
  if (!products.length) throw new AppError("Produk tidak ditemukan", 404);
  const product = products[0];

  const today = new Date().toISOString().slice(0, 10);
  if (today < product.po_open_date || today > product.po_close_date) {
    throw new AppError("Produk tidak dalam periode PO");
  }

  const total_price = product.price * quantity;
  const [result] = await pool.query(
    `INSERT INTO orders (buyer_id, product_id, quantity, total_price, status)
     VALUES (?, ?, ?, ?, ?)`,
    [buyerId, product_id, quantity, total_price, ORDER_STATUS.MENUNGGU]
  );

  await createNotification(product.seller_id, {
    title: "Pesanan Baru",
    message: `Pesanan baru untuk produk ID ${product.id} dari buyer ID ${buyerId}`,
  });

  return { id: (result as any).insertId, total_price };
}

export async function listBuyerOrders(buyerId: number) {
  const [rows] = await pool.query(
    `SELECT o.*, p.name as product_name, p.image_url, p.delivery_date
     FROM orders o
     JOIN products p ON o.product_id = p.id
     WHERE o.buyer_id = ?
     ORDER BY o.created_at DESC`,
    [buyerId]
  );
  return rows;
}

export async function listSellerOrders(sellerId: number) {
  const [rows] = await pool.query(
    `SELECT o.*, p.name as product_name, u.name as buyer_name
     FROM orders o
     JOIN products p ON o.product_id = p.id
     JOIN users u ON o.buyer_id = u.id
     WHERE p.seller_id = ?
     ORDER BY o.created_at DESC`,
    [sellerId]
  );
  return rows;
}

export async function updateOrderStatus(
  sellerId: number,
  orderId: number | string,
  newStatus: OrderStatus
) {
  const [rows] = await pool.query(
    `SELECT o.id, o.status, p.seller_id, o.buyer_id
     FROM orders o
     JOIN products p ON o.product_id = p.id
     WHERE o.id = ?`,
    [orderId]
  );
  const arr = rows as any[];
  if (!arr.length) throw new AppError("Order tidak ditemukan", 404);
  const order = arr[0];
  if (order.seller_id !== sellerId)
    throw new AppError("Tidak boleh mengubah status order orang lain", 403);

  const allowed = VALID_TRANSITIONS[order.status as OrderStatus] || [];
  if (!allowed.includes(newStatus)) {
    throw new AppError(
      `Transisi status tidak valid dari "${order.status}" ke "${newStatus}"`
    );
  }

  await pool.query("UPDATE orders SET status=? WHERE id=?", [
    newStatus,
    orderId,
  ]);

  await createNotification(order.buyer_id, {
    title: "Status Pesanan Diperbarui",
    message: `Status pesanan #${orderId} sekarang: ${newStatus}`,
  });

  return { message: "Status diperbarui", newStatus };
}
