import { OrderStatus } from "@prisma/client";
import { prisma } from "../../src/core/config/database.config.js";
import bcrypt from "bcrypt";

async function main() {
  const hashedPassword = await bcrypt.hash("password123", 10);

  // 1. Create Buyer
  const buyer = await prisma.user.upsert({
    where: { email: "buyer@student.ub.ac.id" },
    update: {},
    create: {
      nim: "195150200000002",
      name: "Buyer Sukajajan",
      major: "Sistem Informasi",
      faculty: "FILKOM",
      batch_year: 2020,
      whatsapp: "081234567892",
      email: "buyer@student.ub.ac.id",
      password: hashedPassword,
      role: "buyer",
    },
  });

  // Get Seller and Products
  const seller = await prisma.user.findFirst({ where: { role: "seller" } });
  if (!seller) {
    console.error("Please run seller-seed.ts first.");
    return;
  }

  const products = await prisma.product.findMany({ where: { seller_id: seller.id } });
  if (products.length === 0) {
    console.error("Seller has no products.");
    return;
  }

  // 2. Create Orders (2 per status)
  const statuses: OrderStatus[] = ["MENUNGGU_KONFIRMASI", "DIPROSES", "SELESAI", "DIBATALKAN"];

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

      // If status is SELESAI, create review
      if (status === "SELESAI") {
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

  // 3. Create Notifications for Buyer
  const notifications = [
    { title: "Pesanan Diterima", message: "Pesananmu telah diterima penjual", is_read: true },
    { title: "Pesanan Selesai", message: "Pesananmu telah selesai", is_read: true },
    { title: "Promo 11.11", message: "Diskon up to 50%", is_read: false },
    { title: "Jangan Lupa Review", message: "Berikan ulasan untuk pesananmu", is_read: false },
  ];

  for (const n of notifications) {
    await prisma.notification.create({
      data: {
        user_id: buyer.id,
        title: n.title,
        message: n.message,
        type: "order",
        is_read: n.is_read,
      },
    });
  }

  console.log("Buyer seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
