# Danus.in API

## Spesifikasi Teknis

- Runtime: Node.js (TypeScript, ESM)
- Framework: Express 5.x
- Database: MySQL (mysql2/promise + `pool.execute`)
- Auth: JWT (Access Token)
- Security: Helmet, CORS
- Validasi: Zod v4
- Logging: Morgan

## Fitur Utama

- Autentikasi:
  - Register: Buyer (whatsapp opsional), Seller (whatsapp wajib)
  - Login dengan NIM atau Email
  - Profil: get & update
  - Upgrade Buyer -> Seller (wajib whatsapp jika belum tersimpan)
- Produk (Seller):
  - CRUD Produk
  - Tanggal PO dengan aturan: open <= close, delivery >= close
- Pencarian & Filter Produk:
  - Query: q, min_price, max_price, open_only
- Pesanan (PO):
  - Buyer membuat order dalam periode PO
  - Seller melihat pesanan masuk & update status
  - Status: Menunggu Pembayaran -> Diproses -> Siap Diambil -> Selesai | Dibatalkan
  - Transisi status tervalidasi
- Notifikasi:
  - Tersimpan di DB
  - Buyer & Seller menerima notifikasi terkait order

## Prasyarat

- Node.js 18+
- MySQL Server 8+ (atau kompatibel)
- Alat CLI untuk MySQL (opsional)

## Instalasi

```bash
git clone https://github.com/raflyrzp/danus-in.git
cd backend
npm install
cp .env.example .env
```

Edit `.env` sesuai lingkungan Anda.

## Environment Variables

```env
PORT=4000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=danus_in
JWT_SECRET=supersecretjwt
JWT_EXPIRES=7d
```

Catatan:

- JWT_SECRET wajib aman di production.
- JWT_EXPIRES menerima format seperti "7d", "12h", dll.

## Setup Database

1. Buat database dan tabel:

```bash
mysql -u root -p
CREATE DATABASE danus_in;
USE danus_in;
SOURCE db/schema.sql;
```

2. Opsional: seed data awal sesuai kebutuhan Anda.

Skema tabel utama:

- users: nim unik wajib, profil kampus, role buyer/seller
- products: milik seller
- orders: relasi buyer & produk, status
- notifications: notifikasi per user

## Menjalankan Aplikasi

Development (auto-reload):

```bash
npm run dev
```

Build + Start (production):

```bash
npm run build
npm start
```

Default: http://localhost:4000

## Struktur Direktori

```
src/
├── index.ts
├── config/
│   └── db.ts
├── constants/
│   └── orderStatus.ts
├── controllers/
│   ├── auth.controller.ts
│   ├── product.controller.ts
│   ├── order.controller.ts
│   └── notification.controller.ts
├── middleware/
│   ├── auth.ts
│   ├── role.ts
│   └── validate.ts
├── routes/
│   ├── auth.routes.ts
│   ├── product.routes.ts
│   ├── order.routes.ts
│   └── notification.routes.ts
├── schemas/
│   ├── auth.schema.ts
│   ├── order.schema.ts
│   ├── product.schema.ts
│   └── query.schema.ts
├── types/
│   ├── entities.ts
│   └── express.d.ts
└── utils/
    ├── errors.ts
    └── password.ts
```

## Konvensi & Keamanan

- Semua endpoint JSON: `Content-Type: application/json`
- Bearer Token di header:
  ```
  Authorization: Bearer <JWT>
  ```
- Helmet aktif untuk header keamanan
- CORS: default allow-all (atur sesuai domain production)
- Penanganan error:
  - Error validasi Zod -> HTTP 400 dengan detail
  - Error logika -> AppError dengan status sesuai

## Validasi (Zod v4)

- Register:
  - buyer: whatsapp opsional
  - seller: whatsapp wajib
  - nim: 6-20 digit
  - password: min 6 char
- Product:
  - price: integer positif
  - tanggal: "YYYY-MM-DD"
  - po_open_date <= po_close_date
  - delivery_date >= po_close_date
- Order:
  - quantity min 1
- List Products Query:
  - min_price/max_price dicoerce -> number
  - min_price <= max_price
  - open_only 'true'|'false'

## Dokumentasi API

Base URL: `http://localhost:4000`

### Auth

- POST /auth/register

  - Body:
    ```
    {
      "nim": "120310001",
      "name": "Nama",
      "major": "Informatika",
      "faculty": "FTI",
      "batch_year": 2023,
      "whatsapp": "08123456789",   // wajib jika role=seller
      "email": "user@example.com",
      "password": "rahasia123",
      "role": "buyer" | "seller"
    }
    ```
  - Response 201:
    ```
    { "message": "Registrasi sukses", "user": { ...profil } }
    ```

- POST /auth/login

  - Body:
    ```
    { "credential": "120310001" | "user@example.com", "password": "rahasia123" }
    ```
  - Response 200:
    ```
    { "token": "JWT", "user": { ...profil } }
    ```

- GET /auth/me

  - Auth: Bearer Token
  - Response 200: profil user

- PUT /auth/me

  - Auth: Bearer Token
  - Body (sebagian):
    ```
    {
      "name": "...",
      "major": "...",
      "faculty": "...",
      "batch_year": 2024,
      "whatsapp": "08....",
      "email": "new@example.com",
      "password": "newpass"
    }
    ```
  - Response 200: `{ "message": "Profil diperbarui" }`

- POST /auth/upgrade-seller
  - Auth: Bearer Token (role buyer)
  - Body:
    ```
    { "whatsapp": "08123456789" } // optional jika profil sudah punya whatsapp
    ```
  - Response 200:
    ```
    { "message": "Upgrade berhasil", "user": { ...profil_terbaru } }
    ```

### Products

- GET /products

  - Query (opsional): `q`, `min_price`, `max_price`, `open_only` ('true'|'false')
  - Contoh: `/products?q=nasi&min_price=10000&max_price=20000&open_only=true`
  - Response 200: daftar produk

- GET /products/me/mine

  - Auth: Bearer Token (seller)
  - Response 200: produk milik seller

- GET /products/:id

  - Response 200: detail produk

- POST /products

  - Auth: Bearer Token (seller)
  - Body:
    ```
    {
      "name": "Nasi Bakar",
      "description": "Pedas level 3",
      "price": 15000,
      "image_url": "https://...",
      "po_open_date": "2025-11-01",
      "po_close_date": "2025-11-10",
      "delivery_date": "2025-11-12"
    }
    ```
  - Response 201: `{ "message": "Produk dibuat", "product": { "id": ... } }`

- PUT /products/:id

  - Auth: Bearer Token (seller, pemilik produk)
  - Body: field yang diubah (minimal 1)
  - Response 200: `{ "message": "Berhasil update" }`

- DELETE /products/:id
  - Auth: Bearer Token (seller, pemilik produk)
  - Response 200: `{ "message": "Berhasil hapus" }`

### Orders

- POST /orders

  - Auth: Bearer Token (buyer)
  - Body:
    ```
    { "product_id": 1, "quantity": 2 }
    ```
  - Aturan: hanya dalam periode PO
  - Response 201:
    ```
    { "message": "Order dibuat", "order": { "id": 7, "total_price": 30000 } }
    ```

- GET /orders/me

  - Auth: Bearer Token (buyer)
  - Response 200: daftar pesanan saya (buyer)

- GET /orders/seller/incoming

  - Auth: Bearer Token (seller)
  - Response 200: pesanan untuk produk milik seller

- PATCH /orders/:id/status
  - Auth: Bearer Token (seller pemilik produk)
  - Body:
    ```
    { "status": "Diproses" | "Siap Diambil" | "Selesai" | "Dibatalkan" }
    ```
  - Aturan transisi:
    - Menunggu Pembayaran -> Diproses | Dibatalkan
    - Diproses -> Siap Diambil | Dibatalkan
    - Siap Diambil -> Selesai
    - Selesai/Dibatalkan -> final
  - Response 200: `{ "message": "Status diperbarui", "newStatus": "..." }`

### Notifications

- GET /notifications

  - Auth: Bearer Token
  - Response 200: daftar notifikasi user

- PATCH /notifications/:id/read
  - Auth: Bearer Token (pemilik notifikasi)
  - Response 200: `{ "message": "Notifikasi ditandai dibaca" }`

## Contoh Error

- Error Validasi (Zod):

  ```
  HTTP 400
  {
    "errors": [
      { "path": "password", "message": "Password minimal 6 karakter" },
      { "path": "whatsapp", "message": "Whatsapp wajib untuk seller" }
    ]
  }
  ```

- Error Akses:

  ```
  HTTP 403
  { "message": "Forbidden: Wrong role" }
  ```

- Error Not Found:
  ```
  HTTP 404
  { "message": "Produk tidak ditemukan" }
  ```

## Catatan Implementasi

- TypeScript ESM (NodeNext). Import antarmodul dalam `src` memakai akhiran `.js` supaya cocok dengan output kompilasi (`dist/*.js`).
- MySQL: gunakan `pool.execute<T>` (bukan `query`) agar type inference tepat (RowDataPacket/ResultSetHeader).
- Express 5: cukup `throw` di async route; error akan diteruskan ke handler pusat.
- Zod v4: gunakan `z.coerce.number()` untuk query numerik agar parsing lebih nyaman.
