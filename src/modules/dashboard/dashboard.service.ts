import { pool } from "../../core/config/database.config.js";
import { RowDataPacket } from "mysql2";

export class DashboardService {
  async getSellerSummary(sellerId: number) {
    // Total revenue (all completed orders)
    const [revenueResult] = await pool.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(o.total_price), 0) as total_revenue
       FROM orders o
       JOIN products p ON o.product_id = p.id
       WHERE p.seller_id = ? AND o.status = 'Selesai'`,
      [sellerId]
    );

    // Pending orders count
    const [pendingResult] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as pending_orders_count
       FROM orders o
       JOIN products p ON o.product_id = p.id
       WHERE p.seller_id = ? AND o.status = 'Menunggu Konfirmasi'`,
      [sellerId]
    );

    // Processing orders count
    const [processingResult] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as processing_orders_count
       FROM orders o
       JOIN products p ON o.product_id = p.id
       WHERE p.seller_id = ? AND o.status = 'Diproses'`,
      [sellerId]
    );

    // Active products count
    const [productsResult] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as active_products_count
       FROM products
       WHERE seller_id = ? AND po_close_date >= CURDATE()`,
      [sellerId]
    );

    // Total products count
    const [totalProductsResult] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total_products_count
       FROM products
       WHERE seller_id = ?`,
      [sellerId]
    );

    // Total orders count
    const [totalOrdersResult] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total_orders_count
       FROM orders o
       JOIN products p ON o.product_id = p.id
       WHERE p.seller_id = ?`,
      [sellerId]
    );

    // Recent orders (last 5)
    const [recentOrders] = await pool.query<RowDataPacket[]>(
      `SELECT 
        o.id,
        o.quantity,
        o.total_price,
        o.status,
        o.created_at,
        p.name as product_name,
        u.name as buyer_name
       FROM orders o
       JOIN products p ON o.product_id = p.id
       JOIN users u ON o.buyer_id = u.id
       WHERE p.seller_id = ?
       ORDER BY o.created_at DESC
       LIMIT 5`,
      [sellerId]
    );

    // Monthly revenue trend (last 6 months)
    const [monthlyRevenue] = await pool.query<RowDataPacket[]>(
      `SELECT 
        DATE_FORMAT(o.created_at, '%Y-%m') as month,
        SUM(o.total_price) as revenue
       FROM orders o
       JOIN products p ON o.product_id = p.id
       WHERE p.seller_id = ? AND o.status = 'Selesai'
         AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(o.created_at, '%Y-%m')
       ORDER BY month DESC`,
      [sellerId]
    );

    return {
      total_revenue: revenueResult[0].total_revenue,
      pending_orders_count: pendingResult[0].pending_orders_count,
      processing_orders_count: processingResult[0].processing_orders_count,
      active_products_count: productsResult[0].active_products_count,
      total_products_count: totalProductsResult[0].total_products_count,
      total_orders_count: totalOrdersResult[0].total_orders_count,
      recent_orders: recentOrders,
      monthly_revenue: monthlyRevenue,
    };
  }

  async getBuyerSummary(buyerId: number) {
    // Total orders count
    const [totalOrdersResult] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total_orders_count
       FROM orders
       WHERE buyer_id = ?`,
      [buyerId]
    );

    // Orders by status
    const [ordersByStatus] = await pool.query<RowDataPacket[]>(
      `SELECT 
        status,
        COUNT(*) as count
       FROM orders
       WHERE buyer_id = ?
       GROUP BY status`,
      [buyerId]
    );

    // Total spent
    const [totalSpentResult] = await pool.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(total_price), 0) as total_spent
       FROM orders
       WHERE buyer_id = ? AND status != 'Dibatalkan'`,
      [buyerId]
    );

    // Recent orders (last 5)
    const [recentOrders] = await pool.query<RowDataPacket[]>(
      `SELECT 
        o.id,
        o.quantity,
        o.total_price,
        o.status,
        o.created_at,
        p.name as product_name,
        p.image_url as product_image,
        u.name as seller_name
       FROM orders o
       JOIN products p ON o.product_id = p.id
       JOIN users u ON p.seller_id = u.id
       WHERE o.buyer_id = ?
       ORDER BY o.created_at DESC
       LIMIT 5`,
      [buyerId]
    );

    return {
      total_orders_count: totalOrdersResult[0].total_orders_count,
      total_spent: totalSpentResult[0].total_spent,
      orders_by_status: ordersByStatus,
      recent_orders: recentOrders,
    };
  }
}
