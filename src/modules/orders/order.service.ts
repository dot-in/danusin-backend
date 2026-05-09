import { prisma } from "../../core/config/database.config.js";
import { AppError } from "../../core/middlewares/error.middleware.js";
import { ERROR_MESSAGES } from "../../shared/constants/message.constant.js";
import {
  ORDER_STATUS,
  ORDER_STATUS_TRANSITIONS,
} from "../../shared/constants/status.constant.js";
import { isPOOpen } from "../../shared/utils/date.util.js";
import { OrderStatus, EntityType } from "@prisma/client";

import { CreateOrderDTO } from "./order.model.js";

export class OrderService {
  async create(buyerId: number, orderData: CreateOrderDTO) {
    return await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: orderData.product_id },
      });

      if (!product) throw new AppError(ERROR_MESSAGES.PRODUCT.NOT_FOUND, 404);

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

      await tx.product.update({
        where: { id: orderData.product_id },
        data: { stock: { decrement: orderData.quantity } },
      });

      const order = await tx.order.create({
        data: {
          buyer_id: buyerId,
          product_id: orderData.product_id,
          seller_id: product.seller_id,
          quantity: orderData.quantity,
          total_price: totalPrice,
          status: ORDER_STATUS.PENDING as OrderStatus,
        },
      });

      await tx.notification.create({
        data: {
          user_id: product.seller_id,
          title: "Pesanan Baru",
          message: `Pesanan baru untuk produk "${product.name}"`,
          type: "order",
        },
      });

      return order;
    });
  }

  async getMyOrders(buyerId: number) {
    const orders = await prisma.order.findMany({
      where: { buyer_id: buyerId },
      include: {
        product: {
          select: {
            name: true,
            seller: { select: { name: true, whatsapp: true } },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const productIds = orders.map((o) => o.product_id);
    const images = await prisma.image.findMany({
      where: {
        entity_type: EntityType.product,
        entity_id: { in: productIds },
        is_primary: true,
      },
    });

    return orders.map((o) => ({
      ...o,
      product_name: o.product.name,
      product_image: images.find((img) => img.entity_id === o.product_id)?.url || null,
      seller_name: o.product.seller.name,
      seller_whatsapp: o.product.seller.whatsapp,
    }));
  }

  async getIncomingOrders(sellerId: number) {
    const orders = await prisma.order.findMany({
      where: { seller_id: sellerId },
      include: {
        product: { select: { name: true } },
        buyer: { select: { name: true, whatsapp: true } },
      },
      orderBy: { created_at: "desc" },
    });

    const productIds = orders.map((o) => o.product_id);
    const images = await prisma.image.findMany({
      where: {
        entity_type: EntityType.product,
        entity_id: { in: productIds },
        is_primary: true,
      },
    });

    return orders.map((o) => ({
      ...o,
      product_name: o.product.name,
      product_image: images.find((img) => img.entity_id === o.product_id)?.url || null,
      buyer_name: o.buyer.name,
      buyer_whatsapp: o.buyer.whatsapp,
    }));
  }

  async getById(orderId: number, userId: number, userRole: "buyer" | "seller") {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        product: { select: { name: true, seller_id: true } },
        buyer: { select: { name: true, whatsapp: true, faculty: true } },
        seller: { select: { name: true, whatsapp: true, faculty: true } },
      },
    });

    if (!order) throw new AppError(ERROR_MESSAGES.ORDER.NOT_FOUND, 404);

    if (userRole === "buyer" && order.buyer_id !== userId) throw new AppError(ERROR_MESSAGES.ORDER.NOT_AUTHORIZED, 403);
    if (userRole === "seller" && order.seller_id !== userId) throw new AppError(ERROR_MESSAGES.ORDER.NOT_AUTHORIZED, 403);

    const image = await prisma.image.findFirst({
      where: {
        entity_type: EntityType.product,
        entity_id: order.product_id,
        is_primary: true,
      },
    });

    return {
      ...order,
      product_name: order.product.name,
      product_image: image?.url || null,
      buyer_name: order.buyer.name,
      buyer_whatsapp: order.buyer.whatsapp,
      buyer_faculty: order.buyer.faculty,
      seller_name: order.seller.name,
      seller_whatsapp: order.seller.whatsapp,
      seller_faculty: order.seller.faculty,
    };
  }

  async cancelOrder(orderId: number, buyerId: number) {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { product: { select: { name: true, seller_id: true } } },
      });

      if (!order) throw new AppError(ERROR_MESSAGES.ORDER.NOT_FOUND, 404);
      if (order.buyer_id !== buyerId) throw new AppError(ERROR_MESSAGES.ORDER.NOT_AUTHORIZED, 403);

      const allowedToCancel = [ORDER_STATUS.PENDING, ORDER_STATUS.PROCESSING];
      if (!allowedToCancel.includes(order.status as any)) throw new AppError(ERROR_MESSAGES.ORDER.INVALID_STATUS_TRANSITION, 400);

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: ORDER_STATUS.CANCELLED as OrderStatus },
      });

      await tx.product.update({
        where: { id: order.product_id },
        data: { stock: { increment: order.quantity } },
      });

      await tx.notification.create({
        data: {
          user_id: order.product.seller_id,
          title: "Pesanan Dibatalkan",
          message: `Pembeli membatalkan pesanan untuk "${order.product.name}"`,
          type: "order",
        },
      });

      return updatedOrder;
    });
  }

  async updateStatus(orderId: number, sellerId: number, newStatus: OrderStatus) {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { product: { select: { name: true, seller_id: true } } },
      });

      if (!order) throw new AppError(ERROR_MESSAGES.ORDER.NOT_FOUND, 404);
      if (order.seller_id !== sellerId) throw new AppError(ERROR_MESSAGES.ORDER.NOT_AUTHORIZED, 403);

      const allowedTransitions = ORDER_STATUS_TRANSITIONS[order.status as keyof typeof ORDER_STATUS_TRANSITIONS];
      if (!allowedTransitions.includes(newStatus as any)) throw new AppError(ERROR_MESSAGES.ORDER.INVALID_STATUS_TRANSITION, 400);

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: newStatus },
      });

      if (newStatus === ORDER_STATUS.CANCELLED) {
        await tx.product.update({
          where: { id: order.product_id },
          data: { stock: { increment: order.quantity } },
        });
      }

      await tx.notification.create({
        data: {
          user_id: order.buyer_id,
          title: "Status Pesanan Diperbarui",
          message: `Status pesanan "${order.product.name}" diubah menjadi "${newStatus}"`,
          type: "order",
        },
      });

      return updatedOrder;
    });
  }
}
