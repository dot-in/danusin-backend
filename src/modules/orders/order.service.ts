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

        // Get product
        const [products] = await connection.query<ProductRow[]>(
          "SELECT * FROM products WHERE id = ?",
          [orderData.product_id]
        );

        if (products.length === 0) {
          throw new AppError(ERROR_MESSAGES.PRODUCT.NOT_FOUND, 404);
        }

        const product = products[0];

        // Check if PO is open
        if (!isPOOpen(product.po_open_date, product.po_close_date)) {
          throw new AppError(ERROR_MESSAGES.PRODUCT.PO_CLOSED, 400);
        }

        // Calculate total price
        const totalPrice = product.price * orderData.quantity;

        // Create order
        const [result] = await connection.query<ResultSetHeader>(
          `INSERT INTO orders (buyer_id, product_id, seller_id, quantity, total_price, status)
          VALUES (?, ?, ?, ?, ?, ?)`,
          [
            buyerId,
            orderData.product_id,
            product.seller_id,
            orderData.quantity,
            totalPrice,
            ORDER_STATUS.PENDING,
          ]
        );

        // Create notification for seller
        await connection.query(
          `INSERT INTO notifications (user_id, title, message)
          VALUES (?, ?, ?)`,
          [
            product.seller_id,
            "Pesanan Baru",
            `Anda mendapat pesanan baru untuk produk "${product.name}"`,
          ]
        );

        await connection.commit();

        const [orders] = await connection.query<OrderRow[]>(
          "SELECT * FROM orders WHERE id = ?",
          [result.insertId]
        );

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
        `SELECT
          o.*,
          p.name as product_name,
          img.url as product_image,
          u.name as seller_name,
          u.whatsapp as seller_whatsapp
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
        `SELECT
          o.*,
          p.name as product_name,
          img.url as product_image,
          u.name as buyer_name,
          u.whatsapp as buyer_whatsapp
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

    async getById(
      orderId: number,
      userId: number,
      userRole: "buyer" | "seller"
    ): Promise<any> {
      const [orders] = await pool.query<OrderRow[]>(
        `SELECT
          o.*,
          p.name as product_name,
          img.url as product_image,
          p.seller_id,
          buyer.name as buyer_name,
          buyer.whatsapp as buyer_whatsapp,
          buyer.faculty as buyer_faculty,
          seller.name as seller_name,
          seller.whatsapp as seller_whatsapp,
          seller.faculty as seller_faculty
        FROM orders o
        LEFT JOIN products p ON o.product_id = p.id
        LEFT JOIN images img ON img.entity_type = 'product' AND img.entity_id = p.id AND img.is_primary = TRUE
        LEFT JOIN users buyer ON o.buyer_id = buyer.id
        LEFT JOIN users seller ON p.seller_id = seller.id
        WHERE o.id = ?`,
        [orderId]
      );

      if (orders.length === 0) {
        throw new AppError(ERROR_MESSAGES.ORDER.NOT_FOUND, 404);
      }

      const order = orders[0];

      // Check authorization
      if (userRole === "buyer" && order.buyer_id !== userId) {
        throw new AppError(ERROR_MESSAGES.ORDER.NOT_AUTHORIZED, 403);
      }

      if (userRole === "seller" && order.seller_id !== userId) {
        throw new AppError(ERROR_MESSAGES.ORDER.NOT_AUTHORIZED, 403);
      }

      return order;
    }

    // Allow buyer to cancel their order
    async cancelOrder(orderId: number, buyerId: number): Promise<Order> {
      const connection = await pool.getConnection();

      try {
        await connection.beginTransaction();

        // Fetch order with product info (to get seller and product name)
        const [orders] = await connection.query<OrderRow[]>(
          `SELECT o.*, p.name as product_name, p.seller_id
          FROM orders o
          LEFT JOIN products p ON o.product_id = p.id
          WHERE o.id = ?`,
          [orderId]
        );

        if (orders.length === 0) {
          throw new AppError(ERROR_MESSAGES.ORDER.NOT_FOUND, 404);
        }

        const order = orders[0] as any;

        // Only the buyer who created the order can cancel it
        if (order.buyer_id !== buyerId) {
          throw new AppError(ERROR_MESSAGES.ORDER.NOT_AUTHORIZED, 403);
        }

        // Only allow cancellation from pending or processing states
        const allowedToCancel = [
          ORDER_STATUS.PENDING,
          ORDER_STATUS.PROCESSING,
        ];
        if (!allowedToCancel.includes(order.status)) {
          throw new AppError(ERROR_MESSAGES.ORDER.INVALID_STATUS_TRANSITION, 400);
        }

        // Update status to cancelled
        await connection.query("UPDATE orders SET status = ? WHERE id = ?", [
          ORDER_STATUS.CANCELLED,
          orderId,
        ]);

        // Notify seller about cancellation
        await connection.query(
          `INSERT INTO notifications (user_id, title, message)
          VALUES (?, ?, ?)`,
          [
            order.seller_id,
            "Pesanan Dibatalkan",
            `Pembeli telah membatalkan pesanan untuk produk \"${order.product_name || ""}\"`,
          ]
        );

        await connection.commit();

        const [updatedOrders] = await connection.query<OrderRow[]>(
          "SELECT * FROM orders WHERE id = ?",
          [orderId]
        );

        return updatedOrders[0];
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    }

    async updateStatus(
      orderId: number,
      sellerId: number,
      newStatus: OrderStatus
    ): Promise<Order> {
      const connection = await pool.getConnection();

      try {
        await connection.beginTransaction();

        // Get order with product
        const [orders] = await connection.query<OrderRow[]>(
          `SELECT o.*, p.seller_id, p.name as product_name
          FROM orders o
          LEFT JOIN products p ON o.product_id = p.id
          WHERE o.id = ?`,
          [orderId]
        );

        if (orders.length === 0) {
          throw new AppError(ERROR_MESSAGES.ORDER.NOT_FOUND, 404);
        }

        const order = orders[0] as any;

        // Check ownership
        if (order.seller_id !== sellerId) {
          throw new AppError(ERROR_MESSAGES.ORDER.NOT_AUTHORIZED, 403);
        }

        // Check status transition
        const allowedTransitions = ORDER_STATUS_TRANSITIONS[order.status];
        if (!allowedTransitions.includes(newStatus)) {
          throw new AppError(ERROR_MESSAGES.ORDER.INVALID_STATUS_TRANSITION, 400);
        }

        // Update status
        await connection.query("UPDATE orders SET status = ? WHERE id = ?", [
          newStatus,
          orderId,
        ]);

        // Create notification for buyer
        await connection.query(
          `INSERT INTO notifications (user_id, title, message)
          VALUES (?, ?, ?)`,
          [
            order.buyer_id,
            "Status Pesanan Diperbarui",
            `Status pesanan "${order.product_name}" diperbarui menjadi "${newStatus}"`,
          ]
        );

        await connection.commit();

        const [updatedOrders] = await connection.query<OrderRow[]>(
          "SELECT * FROM orders WHERE id = ?",
          [orderId]
        );

        return updatedOrders[0];
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    }
  }
