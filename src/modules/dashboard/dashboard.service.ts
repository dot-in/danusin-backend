import { pool } from "../../core/config/database.config.js";
import type { RowDataPacket } from "mysql2";

export class DashboardService {
  async getSellerSummary(sellerId: number) {
    // 1. Total Pendapatan (Seumur Hidup) - Status 'Selesai'
    const [revenueResult] = await pool.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(o.total_price), 0) as total_revenue
       FROM orders o
       JOIN products p ON o.product_id = p.id
       WHERE p.seller_id = ? AND o.status = 'Selesai'`,
      [sellerId]
    );

    // 2. Pendapatan Bulan Ini Saja (FIX untuk kartu "Penjualan Bulan Ini")
    const [currentMonthRevenue] = await pool.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(o.total_price), 0) as month_revenue
       FROM orders o
       JOIN products p ON o.product_id = p.id
       WHERE p.seller_id = ?
       AND o.status = 'Selesai'
       AND MONTH(o.created_at) = MONTH(CURRENT_DATE())
       AND YEAR(o.created_at) = YEAR(CURRENT_DATE())`,
      [sellerId]
    );

    // 3. Hitung Pesanan Menunggu
    const [pendingResult] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as pending_orders_count
       FROM orders o
       JOIN products p ON o.product_id = p.id
       WHERE p.seller_id = ? AND o.status = 'Menunggu Konfirmasi'`,
      [sellerId]
    );

    // 4. Hitung Pesanan Selesai (FIX untuk kartu "Pesanan Selesai")
    const [completedResult] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as completed_orders_count
       FROM orders o
       JOIN products p ON o.product_id = p.id
       WHERE p.seller_id = ? AND o.status = 'Selesai'`,
      [sellerId]
    );

    // 5. Total Produk
    const [totalProductsResult] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total_products_count
       FROM products
       WHERE seller_id = ?`,
      [sellerId]
    );

    // 6. Total Semua Pesanan (Apapun statusnya)
    const [totalOrdersResult] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total_orders_count
       FROM orders o
       JOIN products p ON o.product_id = p.id
       WHERE p.seller_id = ?`,
      [sellerId]
    );

    // 7. Pesanan Terbaru (List 5)
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

    // 8. Grafik Penjualan Bulanan (Data Chart)
    const [monthlySales] = await pool.query<RowDataPacket[]>(
      `SELECT
        DATE_FORMAT(o.created_at, '%b') as month, -- Output: Jan, Feb, Mar
        SUM(o.total_price) as revenue
       FROM orders o
       JOIN products p ON o.product_id = p.id
       WHERE p.seller_id = ? AND o.status = 'Selesai'
         AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(o.created_at, '%Y-%m'), DATE_FORMAT(o.created_at, '%b')
       ORDER BY DATE_FORMAT(o.created_at, '%Y-%m') ASC`,
      [sellerId]
    );

    // RETURN OBJECT (Disesuaikan dengan nama properti yang diminta Frontend)
    return {
      total_revenue: revenueResult[0].total_revenue,

      // FIX: Kirim angka pendapatan bulan ini, bukan array grafik
      monthly_revenue: currentMonthRevenue[0].month_revenue,

      // FIX: Kirim data grafik dengan nama key 'monthly_sales'
      monthly_sales: monthlySales,

      total_products_count: totalProductsResult[0].total_products_count,
      total_orders_count: totalOrdersResult[0].total_orders_count,
      pending_orders_count: pendingResult[0].pending_orders_count,

      // FIX: Kirim jumlah pesanan selesai
      completed_orders_count: completedResult[0].completed_orders_count,

      recent_orders: recentOrders,
    };
  }

  // ... (Bagian getBuyerSummary biarkan tetap sama, tidak perlu diubah)
  async getBuyerSummary(buyerId: number) {
    const [totalOrdersResult] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total_orders_count FROM orders WHERE buyer_id = ?`,
      [buyerId]
    );

    const [ordersByStatus] = await pool.query<RowDataPacket[]>(
      `SELECT status, COUNT(*) as count FROM orders WHERE buyer_id = ? GROUP BY status`,
      [buyerId]
    );

    const [totalSpentResult] = await pool.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(total_price), 0) as total_spent FROM orders WHERE buyer_id = ? AND status != 'Dibatalkan'`,
      [buyerId]
    );

    const [recentOrders] = await pool.query<RowDataPacket[]>(
      `SELECT
        o.id, o.quantity, o.total_price, o.status, o.created_at,
        p.name as product_name, p.image_url as product_image, u.name as seller_name
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
