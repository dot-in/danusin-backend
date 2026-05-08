import { ResultSetHeader } from "mysql2";
import { pool } from "../../core/config/database.config.js";
import { AppError } from "../../core/middlewares/error.middleware.js";
import { OrderRow, ProductRow } from "../../shared/types/database.types.js";
import { Order, OrderStatus } from "../../shared/types/common.types.js";
import { ERROR_MESSAGES } from "../../shared/constants/message.constant.js";
import {
  ORDER_STATUS,
  ORDER_STATUS_TRANSITIONS,
} from "../../shared/constants/status.constant.js";
import { isPOOpen } from "../../shared/utils/date.util.js";

interface CreateOrderDTO {
  product_id: number;
  quantity: number;
}

export class OrderService {
  async create(buyerId: number, orderData: CreateOrderDTO): Promise<Order> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [products] = await connection.query<ProductRow[]>(
        "SELECT * FROM products WHERE id = ? FOR UPDATE",
        [orderData.product_id]
      );

      if (products.length === 0) throw new AppError(ERROR_MESSAGES.PRODUCT.NOT_FOUND, 404);
      const product = products[0];

      if (!isPOOpen(product.po_open_date, product.po_close_date)) {
        throw new AppError(ERROR_MESSAGES.PRODUCT.PO_CLOSED, 400);
      }

      if (product.seller_id === buyerId) {
        throw new AppError("Anda tidak dapat membeli produk sendiri", 400);
      }

      if (product.stock < orderData.quantity) {
        throw new AppError(`Stok tidak mencukupi. Tersedia: ${product.stock}`, 400);
      }

      const totalPrice = product.price * orderData.quantity;

      await connection.query("UPDATE products SET stock = stock - ? WHERE id = ?", [
        orderData.quantity,
        orderData.product_id,
      ]);

      const [result] = await connection.query<ResultSetHeader>(
        `INSERT INTO orders (buyer_id, product_id, seller_id, quantity, total_price, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [buyerId, orderData.product_id, product.seller_id, orderData.quantity, totalPrice, ORDER_STATUS.PENDING]
      );

      await connection.query(
        "INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)",
        [product.seller_id, "Pesanan Baru", `Pesanan baru untuk produk "${product.name}"`]
      );

      await connection.commit();
      const [orders] = await connection.query<OrderRow[]>("SELECT * FROM orders WHERE id = ?", [result.insertId]);
      return orders[0];
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async getMyOrders(buyerId: number): Promise<any[]> {
    const [orders] = await pool.query<OrderRow[]>(
      `SELECT o.*, p.name as product_name, img.url as product_image,
        u.name as seller_name, u.whatsapp as seller_whatsapp
       FROM orders o
       LEFT JOIN products p ON o.product_id = p.id
       LEFT JOIN images img ON img.entity_type = 'product' AND img.entity_id = p.id AND img.is_primary = TRUE
       LEFT JOIN users u ON p.seller_id = u.id
       WHERE o.buyer_id = ?
       ORDER BY o.created_at DESC`,
      [buyerId]
    );
    return orders;
  }

  async getIncomingOrders(sellerId: number): Promise<any[]> {
    const [orders] = await pool.query<OrderRow[]>(
      `SELECT o.*, p.name as product_name, img.url as product_image,
        u.name as buyer_name, u.whatsapp as buyer_whatsapp
       FROM orders o
       LEFT JOIN products p ON o.product_id = p.id
       LEFT JOIN images img ON img.entity_type = 'product' AND img.entity_id = p.id AND img.is_primary = TRUE
       LEFT JOIN users u ON o.buyer_id = u.id
       WHERE p.seller_id = ?
       ORDER BY o.created_at DESC`,
      [sellerId]
    );
    return orders;
  }

  async getById(orderId: number, userId: number, userRole: "buyer" | "seller"): Promise<any> {
    const [orders] = await pool.query<OrderRow[]>(
      `SELECT o.*, p.name as product_name, img.url as product_image, p.seller_id,
        buyer.name as buyer_name, buyer.whatsapp as buyer_whatsapp, buyer.faculty as buyer_faculty,
        seller.name as seller_name, seller.whatsapp as seller_whatsapp, seller.faculty as seller_faculty
       FROM orders o
       LEFT JOIN products p ON o.product_id = p.id
       LEFT JOIN images img ON img.entity_type = 'product' AND img.entity_id = p.id AND img.is_primary = TRUE
       LEFT JOIN users buyer ON o.buyer_id = buyer.id
       LEFT JOIN users seller ON p.seller_id = seller.id
       WHERE o.id = ?`,
      [orderId]
    );

    if (orders.length === 0) throw new AppError(ERROR_MESSAGES.ORDER.NOT_FOUND, 404);
    const order = orders[0] as any;

    if (userRole === "buyer" && order.buyer_id !== userId) throw new AppError(ERROR_MESSAGES.ORDER.NOT_AUTHORIZED, 403);
    if (userRole === "seller" && order.seller_id !== userId) throw new AppError(ERROR_MESSAGES.ORDER.NOT_AUTHORIZED, 403);

    return order;
  }

  async cancelOrder(orderId: number, buyerId: number): Promise<Order> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [orders] = await connection.query<OrderRow[]>(
        `SELECT o.*, p.name as product_name, p.seller_id
         FROM orders o
         LEFT JOIN products p ON o.product_id = p.id
         WHERE o.id = ? FOR UPDATE`,
        [orderId]
      );

      if (orders.length === 0) throw new AppError(ERROR_MESSAGES.ORDER.NOT_FOUND, 404);
      const order = orders[0] as any;

      if (order.buyer_id !== buyerId) throw new AppError(ERROR_MESSAGES.ORDER.NOT_AUTHORIZED, 403);

      const allowedToCancel = [ORDER_STATUS.PENDING, ORDER_STATUS.PROCESSING];
      if (!allowedToCancel.includes(order.status)) throw new AppError(ERROR_MESSAGES.ORDER.INVALID_STATUS_TRANSITION, 400);

      await connection.query("UPDATE orders SET status = ? WHERE id = ?", [ORDER_STATUS.CANCELLED, orderId]);
      await connection.query("UPDATE products SET stock = stock + ? WHERE id = ?", [order.quantity, order.product_id]);

      await connection.query(
        "INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)",
        [order.seller_id, "Pesanan Dibatalkan", `Pembeli membatalkan pesanan untuk "${order.product_name || ""}"`]
      );

      await connection.commit();
      const [updated] = await connection.query<OrderRow[]>("SELECT * FROM orders WHERE id = ?", [orderId]);
      return updated[0];
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async updateStatus(orderId: number, sellerId: number, newStatus: OrderStatus): Promise<Order> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [orders] = await connection.query<OrderRow[]>(
        `SELECT o.*, p.seller_id, p.name as product_name
         FROM orders o
         LEFT JOIN products p ON o.product_id = p.id
         WHERE o.id = ? FOR UPDATE`,
        [orderId]
      );

      if (orders.length === 0) throw new AppError(ERROR_MESSAGES.ORDER.NOT_FOUND, 404);
      const order = orders[0] as any;

      if (order.seller_id !== sellerId) throw new AppError(ERROR_MESSAGES.ORDER.NOT_AUTHORIZED, 403);

      const allowedTransitions = ORDER_STATUS_TRANSITIONS[order.status];
      if (!allowedTransitions.includes(newStatus)) throw new AppError(ERROR_MESSAGES.ORDER.INVALID_STATUS_TRANSITION, 400);

      await connection.query("UPDATE orders SET status = ? WHERE id = ?", [newStatus, orderId]);

      if (newStatus === ORDER_STATUS.CANCELLED) {
        await connection.query("UPDATE products SET stock = stock + ? WHERE id = ?", [order.quantity, order.product_id]);
      }

      await connection.query(
        "INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)",
        [order.buyer_id, "Status Pesanan Diperbarui", `Status pesanan "${order.product_name}" diubah menjadi "${newStatus}"`]
      );

      await connection.commit();
      const [updated] = await connection.query<OrderRow[]>("SELECT * FROM orders WHERE id = ?", [orderId]);
      return updated[0];
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
