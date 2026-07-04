import { prisma } from "../../core/config/database.config.js";
import { AppError } from "../../core/middlewares/error.middleware.js";
import { ORDER_STATUS } from "../../shared/constants/status.constant.js";
import { EntityType } from "@prisma/client";

export class ReviewService {
  async create(userId: number, data: { order_id: number; rating: number; comment?: string; images?: string[] }) {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: data.order_id },
        include: { product: true },
      });

      if (!order) throw new AppError("Pesanan tidak ditemukan", 404);
      if (order.buyer_id !== userId) throw new AppError("Anda tidak berwenang memberikan ulasan untuk pesanan ini", 403);
      if (order.status !== ORDER_STATUS.COMPLETED) throw new AppError("Anda hanya dapat memberikan ulasan untuk pesanan yang sudah selesai", 400);

      const existingReview = await tx.review.findUnique({
        where: { order_id: data.order_id },
      });
      if (existingReview) throw new AppError("Anda sudah memberikan ulasan untuk pesanan ini", 400);

      const review = await tx.review.create({
        data: {
          user_id: userId,
          product_id: order.product_id,
          order_id: data.order_id,
          rating: data.rating,
          comment: data.comment,
        },
      });

      if (data.images && data.images.length > 0) {
        await tx.image.createMany({
          data: data.images.map((url, index) => ({
            url,
            entity_type: EntityType.review,
            entity_id: review.id,
            sort_order: index,
          })),
        });
      }

      // Notify seller
      await tx.notification.create({
        data: {
          user_id: order.seller_id,
          title: "Ulasan Baru",
          message: `Produk "${order.product.name}" mendapatkan ulasan ${data.rating} bintang dari pembeli.`,
          type: "order",
        },
      });

      return review;
    });
  }

  async getByProductId(productId: number) {
    const reviews = await prisma.review.findMany({
      where: { product_id: productId },
      include: {
        user: {
          select: {
            name: true,
            email: true, // For generating avatar if needed, or use profile_image
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    // Fetch images for reviews
    const reviewIds = reviews.map(r => r.id);
    const images = await prisma.image.findMany({
      where: {
        entity_type: EntityType.review,
        entity_id: { in: reviewIds },
      },
    });

    return reviews.map(review => ({
      ...review,
      user_name: review.user.name,
      images: images.filter(img => img.entity_id === review.id).map(img => img.url),
    }));
  }

  async getProductRatingSummary(productId: number) {
    const aggregate = await prisma.review.aggregate({
      where: { product_id: productId },
      _avg: { rating: true },
      _count: { id: true },
    });

    return {
      averageRating: aggregate._avg.rating || 0,
      totalReviews: aggregate._count.id,
    };
  }

  async delete(userId: number, reviewId: number) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { product: true },
    });

    if (!review) throw new AppError("Ulasan tidak ditemukan", 404);

    if (review.product.seller_id !== userId) {
      throw new AppError("Anda tidak berwenang menghapus ulasan ini", 403);
    }

    await prisma.image.deleteMany({
      where: {
        entity_type: EntityType.review,
        entity_id: reviewId,
      },
    });

    await prisma.review.delete({
      where: { id: reviewId },
    });

    return true;
  }
}
