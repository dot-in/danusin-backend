import { prisma } from "../../core/config/database.config.js";
import { OrderStatus, EntityType } from "@prisma/client";
import { ORDER_STATUS } from "../../shared/constants/status.constant.js";

export class DashboardService {
  async getSellerSummary(sellerId: number) {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);

    const [
      totalRevenue,
      monthlyRevenue,
      pendingOrdersCount,
      completedOrdersCount,
      totalProductsCount,
      totalOrdersCount,
    ] = await Promise.all([
      prisma.order.aggregate({
        where: { seller_id: sellerId, status: ORDER_STATUS.COMPLETED as OrderStatus },
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
        where: { seller_id: sellerId, status: ORDER_STATUS.PENDING as OrderStatus },
      }),
      prisma.order.count({
        where: { seller_id: sellerId, status: ORDER_STATUS.COMPLETED as OrderStatus },
      }),
      prisma.product.count({
        where: { seller_id: sellerId },
      }),
      prisma.order.count({
        where: { seller_id: sellerId },
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
      where: {
        seller_id: sellerId,
        status: ORDER_STATUS.COMPLETED as OrderStatus,
        created_at: { gte: sixMonthsAgo },
      },
      _sum: { total_price: true },
    });

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const salesMap = new Map<string, number>();
    monthlySalesRaw.forEach((item) => {
      const m = monthNames[item.created_at.getMonth()];
      salesMap.set(m, (salesMap.get(m) || 0) + (item._sum.total_price || 0));
    });

    const monthlySales = Array.from(salesMap.entries()).map(([month, revenue]) => ({ month, revenue }));

    return {
      total_revenue: totalRevenue._sum.total_price || 0,
      monthly_revenue: monthlyRevenue._sum.total_price || 0,
      pending_orders_count: pendingOrdersCount,
      completed_orders_count: completedOrdersCount,
      total_products_count: totalProductsCount,
      total_orders_count: totalOrdersCount,
      monthly_sales: monthlySales,
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
      where: { buyer_id: buyerId, status: { not: ORDER_STATUS.CANCELLED as OrderStatus } },
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
      orders_by_status: ordersByStatusRaw.map((o) => ({ status: o.status, count: o._count.id })),
      recent_orders: recentOrders.map((o) => ({
        id: o.id,
        quantity: o.quantity,
        total_price: o.total_price,
        status: o.status,
        created_at: o.created_at,
        product_name: o.product.name,
        product_image: images.find((img) => img.entity_id === o.product_id)?.url || null,
        seller_name: o.seller.name,
      })),
    };
  }
}
