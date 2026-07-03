import { Role, EntityType, OrderStatus, NotificationType, Prisma } from "@prisma/client";
import bcrypt from "bcrypt";
import { prisma } from "../../src/core/config/database.config.js";

async function main() {
  try {
    console.log("Starting database seeding...");

    // 1. Clear existing data in reverse order of dependencies
    await prisma.notification.deleteMany();
    await prisma.review.deleteMany();
    await prisma.order.deleteMany();
    await prisma.image.deleteMany();
    await prisma.product.deleteMany();
    await prisma.store.deleteMany();
    await prisma.user.deleteMany();

    console.log("Cleared existing data.");

    const hashedPassword = await bcrypt.hash("password123", 10);

    // 2. Create Seller
    const seller = await prisma.user.create({
      data: {
        nim: "195150200000001",
        name: "Seller Danusan",
        major: "Teknik Informatika",
        faculty: "FILKOM",
        batch_year: 2019,
        whatsapp: "081234567891",
        email: "seller@gmail.com",
        password: hashedPassword,
        role: Role.seller,
      },
    });
    console.log("Seller created.");

    // 3. Create Store
    const store = await prisma.store.create({
      data: {
        user_id: seller.id,
        store_name: "Toko Enak Banget",
        description: "Menjual berbagai macam jajanan dan makanan berat.",
        whatsapp: "081234567891",
        pickup_locations: ["Gedung F", "Kantin", "Gazebo"],
        available_days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"],
        is_active: true,
      },
    });
    console.log("Store created.");

    // 4. Create Products
    const productsData = [
      { name: "Risol Mayo", price: 3000, stock: 50, imageUrl: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500" },
      { name: "Kebab", price: 3000, stock: 40, imageUrl: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=500" },
      { name: "Nasi Bakar", price: 10000, stock: 20, imageUrl: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=500" },
      { name: "Es Teh", price: 3000, stock: 30, imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500" },
      { name: "Siomay", price: 2500, stock: 45, imageUrl: "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=500" },
    ];

    const products = [];
    for (const p of productsData) {
      const product = await prisma.product.create({
        data: {
          seller_id: seller.id,
          name: p.name,
          description: `Deskripsi untuk ${p.name}`,
          price: p.price,
          stock: p.stock,
          pickup_locations: store.pickup_locations as Prisma.InputJsonValue,
          available_days: store.available_days as Prisma.InputJsonValue,
          po_open_date: new Date(),
          po_close_date: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // +7 days
          delivery_date: new Date(new Date().getTime() + 8 * 24 * 60 * 60 * 1000), // +8 days
          is_active: true,
        },
      });
      products.push(product);

      await prisma.image.create({
        data: {
          url: p.imageUrl,
          alt_text: `Gambar ${p.name}`,
          entity_type: EntityType.product,
          entity_id: product.id,
          is_primary: true,
          sort_order: 0,
        },
      });
    }
    console.log("Products and images created.");

    // 5. Create Buyer
    const buyer = await prisma.user.create({
      data: {
        nim: "195150200000002",
        name: "Buyer Sukajajan",
        major: "Sistem Informasi",
        faculty: "FILKOM",
        batch_year: 2020,
        whatsapp: "081234567892",
        email: "buyer@gmail.com",
        password: hashedPassword,
        role: Role.buyer,
      },
    });
    console.log("Buyer created.");

    // 6. Create Orders
    const statuses: OrderStatus[] = [
      OrderStatus.MENUNGGU_KONFIRMASI,
      OrderStatus.DIPROSES,
      OrderStatus.SELESAI,
      OrderStatus.DIBATALKAN,
    ];

    for (const status of statuses) {
      for (let i = 0; i < 2; i++) {
        const product = products[(statuses.indexOf(status) * 2 + i) % products.length];

        const order = await prisma.order.create({
          data: {
            buyer_id: buyer.id,
            seller_id: seller.id,
            product_id: product.id,
            quantity: 2,
            total_price: product.price * 2,
            pickup_location: "Kantin",
            pickup_day: "Senin",
            notes: "Jangan pedas",
            status: status,
          },
        });

        if (status === OrderStatus.SELESAI) {
          await prisma.review.create({
            data: {
              user_id: buyer.id,
              product_id: product.id,
              order_id: order.id,
              rating: 5,
              comment: "Mantap rasanya!",
            },
          });
        }
      }
    }
    console.log("Orders and reviews created.");

    // 7. Create Notifications for Seller
    const sellerNotifications = [
      { title: "Selamat Datang!", message: "Selamat datang di Danus.in", is_read: true, type: NotificationType.system },
      { title: "Toko Aktif", message: "Toko Anda sudah aktif", is_read: true, type: NotificationType.system },
      { title: "Tips Jualan", message: "Gunakan foto yang menarik", is_read: false, type: NotificationType.system },
      { title: "Promo Khusus", message: "Ikuti promo cashback", is_read: false, type: NotificationType.promo },
    ];

    for (const n of sellerNotifications) {
      await prisma.notification.create({
        data: {
          user_id: seller.id,
          title: n.title,
          message: n.message,
          type: n.type,
          is_read: n.is_read,
        },
      });
    }

    // 8. Create Notifications for Buyer
    const buyerNotifications = [
      { title: "Pesanan Diterima", message: "Pesananmu telah diterima penjual", is_read: true, type: NotificationType.order },
      { title: "Pesanan Selesai", message: "Pesananmu telah selesai", is_read: true, type: NotificationType.order },
      { title: "Promo 11.11", message: "Diskon up to 50%", is_read: false, type: NotificationType.promo },
      { title: "Jangan Lupa Review", message: "Berikan ulasan untuk pesananmu", is_read: false, type: NotificationType.order },
    ];

    for (const n of buyerNotifications) {
      await prisma.notification.create({
        data: {
          user_id: buyer.id,
          title: n.title,
          message: n.message,
          type: n.type,
          is_read: n.is_read,
        },
      });
    }
    console.log("Notifications created.");

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Database seeding failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
