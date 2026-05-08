import { pool } from "../../core/config/database.config.js";
import type { RowDataPacket } from "mysql2";

export class DashboardService {
  async getSellerSummary(sellerId: number) {
    const [summary] = await pool.query<RowDataPacket[]>(
      `SELECT 
        (SELECT COALESCE(SUM(o.total_price), 0) FROM orders o JOIN products p ON o.product_id = p.id WHERE p.seller_id = ? AND o.status = 'Selesai') as total_revenue,
        (SELECT COALESCE(SUM(o.total_price), 0) FROM orders o JOIN products p ON o.product_id = p.id WHERE p.seller_id = ? AND o.status = 'Selesai' AND MONTH(o.created_at) = MONTH(CURRENT_DATE()) AND YEAR(o.created_at) = YEAR(CURRENT_DATE())) as monthly_revenue,
        (SELECT COUNT(*) FROM orders o JOIN products p ON o.product_id = p.id WHERE p.seller_id = ? AND o.status = 'Menunggu Konfirmasi') as pending_orders_count,
        (SELECT COUNT(*) FROM orders o JOIN products p ON o.product_id = p.id WHERE p.seller_id = ? AND o.status = 'Selesai') as completed_orders_count,
        (SELECT COUNT(*) FROM products WHERE seller_id = ?) as total_products_count,
        (SELECT COUNT(*) FROM orders o JOIN products p ON o.product_id = p.id WHERE p.seller_id = ?) as total_orders_count`,
      [sellerId, sellerId, sellerId, sellerId, sellerId, sellerId]
    );

    const [recentOrders] = await pool.query<RowDataPacket[]>(
      `SELECT o.id, o.quantity, o.total_price, o.status, o.created_at, p.name as product_name, u.name as buyer_name
       FROM orders o JOIN products p ON o.product_id = p.id JOIN users u ON o.buyer_id = u.id
       WHERE p.seller_id = ? ORDER BY o.created_at DESC LIMIT 5`,
      [sellerId]
    );

    const [monthlySales] = await pool.query<RowDataPacket[]>(
      `SELECT DATE_FORMAT(o.created_at, '%b') as month, SUM(o.total_price) as revenue
       FROM orders o JOIN products p ON o.product_id = p.id
       WHERE p.seller_id = ? AND o.status = 'Selesai' AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(o.created_at, '%Y-%m'), DATE_FORMAT(o.created_at, '%b')
       ORDER BY DATE_FORMAT(o.created_at, '%Y-%m') ASC`,
      [sellerId]
    );

    return { ...summary[0], monthly_sales: monthlySales, recent_orders: recentOrders };
  }

  async getBuyerSummary(buyerId: number) {
    const [summary] = await pool.query<RowDataPacket[]>(
      `SELECT 
        (SELECT COUNT(*) FROM orders WHERE buyer_id = ?) as total_orders_count,
        (SELECT COALESCE(SUM(total_price), 0) FROM orders WHERE buyer_id = ? AND status != 'Dibatalkan') as total_spent`,
      [buyerId, buyerId]
    );

    const [ordersByStatus] = await pool.query<RowDataPacket[]>(
      "SELECT status, COUNT(*) as count FROM orders WHERE buyer_id = ? GROUP BY status",
      [buyerId]
    );

    const [recentOrders] = await pool.query<RowDataPacket[]>(
      `SELECT o.id, o.quantity, o.total_price, o.status, o.created_at, p.name as product_name, img.url as product_image, u.name as seller_name
       FROM orders o JOIN products p ON o.product_id = p.id
       LEFT JOIN images img ON img.entity_type = 'product' AND img.entity_id = p.id AND img.is_primary = TRUE
       JOIN users u ON p.seller_id = u.id
       WHERE o.buyer_id = ? ORDER BY o.created_at DESC LIMIT 5`,
      [buyerId]
    );

    return { ...summary[0], orders_by_status: ordersByStatus, recent_orders: recentOrders };
  }
}
