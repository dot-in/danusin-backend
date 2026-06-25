import { Prisma } from "@prisma/client";
import { prisma } from "../../src/core/config/database.config.js";
import bcrypt from "bcrypt";

async function main() {
  const hashedPassword = await bcrypt.hash("password123", 10);

  // 1. Create Seller
  const seller = await prisma.user.upsert({
    where: { email: "seller@student.ub.ac.id" },
    update: {},
    create: {
      nim: "195150200000001",
      name: "Seller Danusan",
      major: "Teknik Informatika",
      faculty: "FILKOM",
      batch_year: 2019,
      whatsapp: "081234567891",
      email: "seller@student.ub.ac.id",
      password: hashedPassword,
      role: "seller",
    },
  });

  // 2. Create Store
  const store = await prisma.store.upsert({
    where: { user_id: seller.id },
    update: {},
    create: {
      user_id: seller.id,
      store_name: "Toko Enak Banget",
      description: "Menjual berbagai macam jajanan dan makanan berat.",
      whatsapp: "081234567891",
      pickup_locations: ["Gedung F", "Kantin", "Gazebo"],
      available_days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"],
      is_active: true,
    },
  });

  // 3. Create Products
  const productsData = [
    { name: "Risol Mayo", price: 3000, stock: 50 },
    { name: "Kebab", price: 3000, stock: 40 },
    { name: "Nasi Bakar", price: 10000, stock: 20 },
    { name: "Es Teh", price: 3000, stock: 30 },
    { name: "Siomay", price: 2500, stock: 45 },
  ];

  for (const p of productsData) {
    await prisma.product.create({
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
  }

  // 4. Create Notifications for Seller
  const notifications = [
    { title: "Selamat Datang!", message: "Selamat datang di Danus.in", is_read: true },
    { title: "Toko Aktif", message: "Toko Anda sudah aktif", is_read: true },
    { title: "Tips Jualan", message: "Gunakan foto yang menarik", is_read: false },
    { title: "Promo Khusus", message: "Ikuti promo cashback", is_read: false },
  ];

  for (const n of notifications) {
    await prisma.notification.create({
      data: {
        user_id: seller.id,
        title: n.title,
        message: n.message,
        type: "system",
        is_read: n.is_read,
      },
    });
  }

  console.log("Seller seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
