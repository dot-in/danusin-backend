import { Role, EntityType, OrderStatus, NotificationType } from "@prisma/client";
import bcrypt from "bcrypt";
import { prisma } from "../src/core/config/database.config.js";

const PASSWORD_HASH = await bcrypt.hash("password123", 10);

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
    console.log("Starting database seeding with Prisma...");

    // 1. Clear existing data in reverse order of dependencies
    await prisma.notification.deleteMany();
    await prisma.order.deleteMany();
    await prisma.image.deleteMany();
    await prisma.product.deleteMany();
    await prisma.store.deleteMany();
    await prisma.user.deleteMany();

    console.log("Cleared existing data.");

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
    console.log(`Seeded 40 users.`);

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
    console.log(`Seeded ${sellerIds.length} stores.`);

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
    console.log(`Seeded 30 products.`);

    // 5. Seed Images
    const sampleImages = [
      "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500", // Cookies
      "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500", // Ice Cream
      "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=500", // Chicken
      "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500", // Salad/Bowl
      "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=500", // Dimsum
      "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=500", // Donut
      "https://images.unsplash.com/photo-1541167760496-162955ed8a9f?w=500", // Coffee
      "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=500", // Meeting/Food
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500", // Steak/Food
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500", // Health Food
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=500", // Travel Food
      "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=500", // Sandwich
      "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=500", // Toast
      "https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=500", // Pasta
      "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=500", // Salad
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500", // Pizza
      "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=500", // Cake
      "https://images.unsplash.com/photo-1493770348161-369560ae357d?w=500", // Healthy
      "https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=500", // Burger
      "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=500", // Spicy Food
      "https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=500", // Meat
      "https://images.unsplash.com/photo-1506084868730-34ad1193ff14?w=500", // Pancake
      "https://images.unsplash.com/photo-1470333104439-444d00419632?w=500", // Drink
      "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500", // Juice
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
    console.log(`Seeded ${productIds.length} images.`);

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
    console.log("Seeded 50 orders.");

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
    console.log("Seeded 30 notifications.");

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Database seeding failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
