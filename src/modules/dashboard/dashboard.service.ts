import { prisma } from "../../core/config/database.config.js";
import { OrderStatus, EntityType } from "@prisma/client";
import { ORDER_STATUS } from "../../shared/constants/status.constant.js";

export class DashboardService {
  async getSellerSummary(sellerId: number, period: string = "30") {
    const today = new Date();
    let startDate: Date | undefined;

    if (period !== "all") {
      startDate = new Date();
      startDate.setDate(today.getDate() - parseInt(period));
    }

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const revenueWhere = {
      seller_id: sellerId,
      status: ORDER_STATUS.COMPLETED as OrderStatus,
      ...(startDate && { created_at: { gte: startDate } }),
    };

    const [
      totalRevenueData,
      monthlyRevenueData,
      pendingOrdersCount,
      completedOrdersCount,
      totalProductsCount,
      totalOrdersCount,
      products,
    ] = await Promise.all([
      prisma.order.aggregate({
        where: revenueWhere,
        _sum: { total_price: true },
      }),
      prisma.order.aggregate({
        where: {
          seller_id: sellerId,
          status: ORDER_STATUS.COMPLETED as OrderStatus,
          created_at: { gte: firstDayOfMonth },
        },
        _sum: { total_price: true },
      }),
      prisma.order.count({
        where: {
          seller_id: sellerId,
          status: ORDER_STATUS.PENDING as OrderStatus,
        },
      }),
      prisma.order.count({
        where: {
          seller_id: sellerId,
          status: ORDER_STATUS.COMPLETED as OrderStatus,
        },
      }),
      prisma.product.count({
        where: { seller_id: sellerId },
      }),
      prisma.order.count({
        where: {
          seller_id: sellerId,
          ...(startDate && { created_at: { gte: startDate } }),
        },
      }),
      prisma.product.findMany({
        where: { seller_id: sellerId },
        include: {
          orders: {
            where: {
              status: ORDER_STATUS.COMPLETED as OrderStatus,
              created_at: {
                gte: new Date(
                  today.getFullYear(),
                  today.getMonth() - 1,
                  today.getDate(),
                ),
              }, // last 30 days avg
            },
          },
        },
      }),
    ]);

    const recentOrders = await prisma.order.findMany({
      where: { seller_id: sellerId },
      include: {
        product: { select: { name: true } },
        buyer: { select: { name: true } },
      },
      orderBy: { created_at: "desc" },
      take: 5,
    });

    const monthlySalesRaw = await prisma.order.groupBy({
      by: ["created_at"],
      where: revenueWhere,
      _sum: { total_price: true },
    });

    // Formatting chart based on period (if 1 or 3 days, maybe hours, but grouped by day is fine for all)
    const salesMap = new Map<string, number>();
    const formatStr =
      period === "all" || parseInt(period) > 7 ? "MM-DD" : "MM-DD";

    monthlySalesRaw.forEach((item) => {
      const d = `${item.created_at.getMonth() + 1}/${item.created_at.getDate()}`;
      salesMap.set(d, (salesMap.get(d) || 0) + (item._sum.total_price || 0));
    });

    const monthlySales = Array.from(salesMap.entries()).map(
      ([date, revenue]) => ({ month: date, revenue }),
    );

    const needsRestock = products
      .filter((p) => p.stock < 5)
      .map((p) => ({ id: p.id, name: p.name, stock: p.stock }));

    // Low performance: high stock, 0 sales in last 30 days
    const reduceStock = products
      .filter((p) => p.stock > 10 && p.orders.length === 0)
      .map((p) => ({ id: p.id, name: p.name, stock: p.stock }));

    const insights = {
      needsRestock,
      reduceStock,
      suggestion:
        needsRestock.length > 0
          ? "Segera tambah stok untuk produk yang menipis."
          : reduceStock.length > 0
            ? "Buat promo untuk produk yang kurang laku."
            : "Performa toko Anda baik, pertahankan!",
    };

    return {
      total_revenue: totalRevenueData._sum.total_price || 0,
      monthly_revenue: monthlyRevenueData._sum.total_price || 0,
      pending_orders_count: pendingOrdersCount,
      completed_orders_count: completedOrdersCount,
      total_products_count: totalProductsCount,
      total_orders_count: totalOrdersCount,
      monthly_sales: monthlySales,
      insights,
      recent_orders: recentOrders.map((o) => ({
        id: o.id,
        quantity: o.quantity,
        total_price: o.total_price,
        status: o.status,
        created_at: o.created_at,
        product_name: o.product.name,
        buyer_name: o.buyer.name,
      })),
    };
  }

  async getBuyerSummary(buyerId: number) {
    const [summary, ordersByStatusRaw] = await Promise.all([
      prisma.order.aggregate({
        where: { buyer_id: buyerId },
        _count: { id: true },
        _sum: { total_price: true },
      }),
      prisma.order.groupBy({
        by: ["status"],
        where: { buyer_id: buyerId },
        _count: { id: true },
      }),
    ]);

    const totalSpent = await prisma.order.aggregate({
      where: {
        buyer_id: buyerId,
        status: { not: ORDER_STATUS.CANCELLED as OrderStatus },
      },
      _sum: { total_price: true },
    });

    const recentOrders = await prisma.order.findMany({
      where: { buyer_id: buyerId },
      include: {
        product: { select: { name: true } },
        seller: { select: { name: true } },
      },
      orderBy: { created_at: "desc" },
      take: 5,
    });

    const productIds = recentOrders.map((o) => o.product_id);
    const images = await prisma.image.findMany({
      where: {
        entity_type: EntityType.product,
        entity_id: { in: productIds },
        is_primary: true,
      },
    });

    return {
      total_orders_count: summary._count.id,
      total_spent: totalSpent._sum.total_price || 0,
      orders_by_status: ordersByStatusRaw.map((o) => ({
        status: o.status,
        count: o._count.id,
      })),
      recent_orders: recentOrders.map((o) => ({
        id: o.id,
        quantity: o.quantity,
        total_price: o.total_price,
        status: o.status,
        created_at: o.created_at,
        product_name: o.product.name,
        product_image:
          images.find((img) => img.entity_id === o.product_id)?.url || null,
        seller_name: o.seller.name,
      })),
    };
  }
}
