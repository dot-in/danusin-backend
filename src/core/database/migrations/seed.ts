import { prisma, closePool } from "../../config/database.config.js";
import { logger } from "../../config/logger.config.js";
import { Role, EntityType, OrderStatus, NotificationType } from "@prisma/client";

const PASSWORD_HASH = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYqVqQHqKGJW"; // password123

const MAJORS = ["Informatika", "Sistem Informasi", "Teknik Elektro", "Teknik Mesin", "Teknik Sipil", "Arsitektur", "Hukum", "Ekonomi", "Psikologi", "Kedokteran"];
const FACULTIES = ["Teknik", "Hukum", "Ekonomi dan Bisnis", "Kedokteran", "MIPA", "FISIP"];
const CAMPUSES = ["Kampus A", "Kampus B", "Kampus C", "Asrama", "Fakultas Teknik", "Perpustakaan Pusat"];
const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const STATUSES: OrderStatus[] = [OrderStatus.Menunggu_Konfirmasi, OrderStatus.Diproses, OrderStatus.Selesai, OrderStatus.Dibatalkan];

const getRandom = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomJSON = (arr: any[], count: number) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

async function seed() {
  try {
    logger.info("Starting database seeding with Prisma...");

    // 1. Clear existing data
    await prisma.notification.deleteMany();
    await prisma.order.deleteMany();
    await prisma.image.deleteMany();
    await prisma.product.deleteMany();
    await prisma.store.deleteMany();
    await prisma.user.deleteMany();

    logger.info("Cleared existing data.");

    // 2. Seed Users (40 users: 15 sellers, 25 buyers)
    const sellerIds: number[] = [];
    const buyerIds: number[] = [];

    for (let i = 1; i <= 40; i++) {
      const role = i <= 15 ? Role.seller : Role.buyer;
      const user = await prisma.user.create({
        data: {
          nim: `210810701${i.toString().padStart(4, "0")}`,
          name: `User ${i}`,
          major: getRandom(MAJORS),
          faculty: getRandom(FACULTIES),
          batch_year: getRandomInt(2020, 2024),
          whatsapp: `628${getRandomInt(100000000, 999999999)}`,
          email: `user${i}@example.com`,
          password: PASSWORD_HASH,
          role: role,
        },
      });

      if (role === Role.seller) sellerIds.push(user.id);
      else buyerIds.push(user.id);
    }
    logger.info(`Seeded 40 users.`);

    // 3. Seed Stores (for each seller)
    for (const sellerId of sellerIds) {
      await prisma.store.create({
        data: {
          user_id: sellerId,
          store_name: `Toko Seller ${sellerId}`,
          description: `Deskripsi toko untuk seller ${sellerId}. Menyediakan berbagai jajanan mahasiswa.`,
          whatsapp: `628${getRandomInt(100000000, 999999999)}`,
          pickup_locations: getRandomJSON(CAMPUSES, getRandomInt(1, 3)),
          available_days: getRandomJSON(DAYS, getRandomInt(3, 5)),
        },
      });
    }
    logger.info(`Seeded ${sellerIds.length} stores.`);

    // 4. Seed Products (30 products)
    const productIds: number[] = [];
    const productNames = ["Mochi", "Risol Mayo", "Nasi Kulit", "Dimsum", "Brownies", "Es Kopi", "Sandwich", "Cireng", "Donat", "Bakso Goreng"];
    
    for (let i = 1; i <= 30; i++) {
      const sellerId = getRandom(sellerIds);
      const today = new Date();
      const openDate = new Date(today);
      const closeDate = new Date(today);
      closeDate.setDate(today.getDate() + getRandomInt(3, 7));
      const deliveryDate = new Date(closeDate);
      deliveryDate.setDate(closeDate.getDate() + getRandomInt(2, 5));

      const product = await prisma.product.create({
        data: {
          seller_id: sellerId,
          name: `${getRandom(productNames)} ${i}`,
          description: `Deskripsi lezat untuk produk ${i}. Dibuat fresh setiap hari.`,
          price: getRandomInt(2, 25) * 1000,
          stock: getRandomInt(10, 100),
          pickup_locations: getRandomJSON(CAMPUSES, getRandomInt(1, 2)),
          available_days: getRandomJSON(DAYS, getRandomInt(2, 4)),
          po_open_date: openDate,
          po_close_date: closeDate,
          delivery_date: deliveryDate,
        },
      });
      productIds.push(product.id);
    }
    logger.info(`Seeded 30 products.`);

    // 5. Seed Images
    const sampleImages = [
      "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500",
      "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500",
      "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=500",
      "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500",
      "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=500"
    ];

    for (const productId of productIds) {
      await prisma.image.create({
        data: {
          url: getRandom(sampleImages),
          alt_text: `Product Image ${productId}`,
          entity_type: EntityType.product,
          entity_id: productId,
          is_primary: true,
          sort_order: 0,
        },
      });
    }
    logger.info(`Seeded ${productIds.length} images.`);

    // 6. Seed Orders (50 orders)
    for (let i = 1; i <= 50; i++) {
      const buyerId = getRandom(buyerIds);
      const productId = getRandom(productIds);
      
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { seller_id: true, price: true }
      });
      
      if (!product) continue;
      
      const quantity = getRandomInt(1, 5);

      await prisma.order.create({
        data: {
          buyer_id: buyerId,
          product_id: productId,
          seller_id: product.seller_id,
          quantity: quantity,
          total_price: product.price * quantity,
          pickup_location: getRandom(CAMPUSES),
          pickup_day: getRandom(DAYS),
          status: getRandom(STATUSES),
        },
      });
    }
    logger.info("Seeded 50 orders.");

    // 7. Seed Notifications (30 notifications)
    const types: NotificationType[] = [NotificationType.order, NotificationType.system, NotificationType.promo];
    const userIds = [...sellerIds, ...buyerIds];

    for (let i = 1; i <= 30; i++) {
      await prisma.notification.create({
        data: {
          user_id: getRandom(userIds),
          title: `Notifikasi ${i}`,
          message: `Pesan notifikasi baru untuk Anda.`,
          type: getRandom(types),
          is_read: Math.random() > 0.5,
        },
      });
    }
    logger.info("Seeded 30 notifications.");

    logger.info("Database seeding completed successfully!");
  } catch (error) {
    logger.error({ error }, "Database seeding failed");
  } finally {
    await closePool();
  }
}

seed();
