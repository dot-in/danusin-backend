# Danus.in API

Modern RESTful API untuk platform Pre-Order mahasiswa, dibangun dengan Express.js 5, TypeScript 5.7, dan MySQL.

## 🚀 Tech Stack

- **Runtime**: Node.js 22+
- **Framework**: Express.js 5.1
- **Language**: TypeScript 5.7
- **Database**: MySQL 8.0+
- **Validation**: Zod 4.1
- **Authentication**: JWT (jsonwebtoken 9.0)
- **Security**: Helmet 8.1, bcrypt 6.0
- **Logging**: Pino 9.5
- **Code Quality**: Biome 1.9
- **Dev Tools**: tsx 4.19

## 📁 Struktur Project

```
src/
├── core/                    # Core functionality
│   ├── config/             # Configuration files
│   │   ├── app.config.ts   # Express app setup
│   │   ├── database.config.ts
│   │   ├── env.config.ts
│   │   └── logger.config.ts
│   ├── middleware/         # Global middleware
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── validation.middleware.ts
│   └── database/          # Database setup
│       └── migrations/
│           └── init.sql
├── modules/               # Feature modules
│   ├── auth/             # Authentication
│   ├── users/            # User management
│   ├── products/         # Product management
│   ├── orders/           # Order management
│   ├── notifications/    # Notifications
│   ├── upload/          # File upload
│   └── dashboard/       # Dashboard stats
├── shared/              # Shared resources
│   ├── constants/       # Constants & enums
│   ├── types/          # TypeScript types
│   └── utils/          # Utility functions
└── server.ts           # Entry point
```

## 🔧 Installation

### Prerequisites

- Node.js >= 22.0.0
- MySQL >= 8.0
- npm atau pnpm

### Steps

1. **Clone repository**

   ```bash
   git clone https://github.com/raflyrzp/danusin-backend.git
   cd danusin-backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Setup environment**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` dan sesuaikan konfigurasi database dan JWT secret.

4. **Create database**

   ```bash
   mysql -u root -p < src/core/database/migrations/init.sql
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

## 🌐 API Endpoints

### Base URL

```
http://localhost:3000/api/v1
```

### Authentication

| Method | Endpoint               | Auth     | Description        |
| ------ | ---------------------- | -------- | ------------------ |
| POST   | `/auth/register`       | ❌       | Register user baru |
| POST   | `/auth/login`          | ❌       | Login user         |
| GET    | `/auth/me`             | ✅       | Get profil sendiri |
| PUT    | `/auth/me`             | ✅       | Update profil      |
| POST   | `/auth/upgrade-seller` | ✅ Buyer | Upgrade ke seller  |

### Products

| Method | Endpoint            | Auth      | Description       |
| ------ | ------------------- | --------- | ----------------- |
| GET    | `/products`         | ❌        | List semua produk |
| GET    | `/products/:id`     | ❌        | Detail produk     |
| GET    | `/products/me/mine` | ✅ Seller | Produk milik saya |
| POST   | `/products`         | ✅ Seller | Buat produk baru  |
| PUT    | `/products/:id`     | ✅ Seller | Update produk     |
| DELETE | `/products/:id`     | ✅ Seller | Hapus produk      |

### Orders

| Method | Endpoint                  | Auth      | Description     |
| ------ | ------------------------- | --------- | --------------- |
| POST   | `/orders`                 | ✅ Buyer  | Buat pesanan    |
| GET    | `/orders/me`              | ✅ Buyer  | Riwayat pesanan |
| GET    | `/orders/seller/incoming` | ✅ Seller | Pesanan masuk   |
| GET    | `/orders/:id`             | ✅        | Detail pesanan  |
| PATCH  | `/orders/:id/status`      | ✅ Seller | Update status   |

### Users

| Method | Endpoint                    | Auth | Description          |
| ------ | --------------------------- | ---- | -------------------- |
| GET    | `/users/:id/public-profile` | ❌   | Profil publik seller |

### Notifications

| Method | Endpoint                  | Auth | Description         |
| ------ | ------------------------- | ---- | ------------------- |
| GET    | `/notifications`          | ✅   | List notifikasi     |
| PATCH  | `/notifications/:id/read` | ✅   | Tandai dibaca       |
| POST   | `/notifications/read-all` | ✅   | Tandai semua dibaca |

### Upload

| Method | Endpoint        | Auth      | Description          |
| ------ | --------------- | --------- | -------------------- |
| POST   | `/upload/image` | ✅ Seller | Upload gambar produk |

### Dashboard

| Method | Endpoint                    | Auth      | Description      |
| ------ | --------------------------- | --------- | ---------------- |
| GET    | `/dashboard/seller/summary` | ✅ Seller | Ringkasan seller |
| GET    | `/dashboard/buyer/summary`  | ✅ Buyer  | Ringkasan buyer  |

## 📝 Request & Response Examples

### Register

```json
POST /api/v1/auth/register
{
  "nim": "2108107010001",
  "name": "John Doe",
  "major": "Informatika",
  "faculty": "Teknik",
  "batch_year": 2021,
  "whatsapp": "081234567890",
  "email": "john@example.com",
  "password": "password123"
}

Response 201:
{
  "message": "Registrasi berhasil",
  "data": {
    "user": {
      "id": 1,
      "nim": "2108107010001",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "buyer",
      ...
    }
  }
}
```

### Login

```json
POST /api/v1/auth/login
{
  "credential": "john@example.com",
  "password": "password123"
}

Response 200:
{
  "message": "Login berhasil",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { ... }
  }
}
```

### Create Product

```json
POST /api/v1/products
Authorization: Bearer <token>

{
  "name": "Baju Kelas Informatika 2021",
  "description": "Baju kelas batch 2021...",
  "price": 75000,
  "image_url": "https://...",
  "po_open_date": "2025-11-20",
  "po_close_date": "2025-11-30",
  "delivery_date": "2025-12-15"
}

Response 201:
{
  "message": "Produk berhasil dibuat",
  "data": {
    "product": { ... }
  }
}
```

## 🔐 Authentication

API menggunakan JWT (JSON Web Token) untuk authentication.

### Header Format

```
Authorization: Bearer <your_token_here>
```

### Token Payload

```json
{
  "id": 1,
  "nim": "2108107010001",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "buyer"
}
```

## 🛠️ Development

### Available Scripts

```bash
# Development mode dengan hot reload
npm run dev

# Build untuk production
npm run build

# Run production build
npm start

# Linting
npm run lint
npm run lint:fix

# Format code
npm run format
```

### Code Quality

Project menggunakan **Biome** untuk linting dan formatting:

```bash
# Check code quality
npm run lint

# Auto fix issues
npm run lint:fix

# Format code
npm run format
```

## 🏗️ Build & Deployment

### Build Production

```bash
npm run build
```

Output akan ada di folder `dist/`.

### Run Production

```bash
npm start
```

### Environment Variables (Production)

Pastikan set environment variables berikut di production:

```env
NODE_ENV=production
PORT=3000
DATABASE_HOST=your-db-host
DATABASE_USER=your-db-user
DATABASE_PASSWORD=your-db-password
DATABASE_NAME=danus_in
JWT_SECRET=your-very-secure-jwt-secret-min-32-characters
```

## 📊 Database Schema

### Users

- id, nim, name, major, faculty, batch_year
- whatsapp, email, password, role
- created_at, updated_at

### Products

- id, seller_id, name, description, price
- image_url, po_open_date, po_close_date, delivery_date
- created_at, updated_at

### Orders

- id, buyer_id, product_id, quantity, total_price
- status (Menunggu Konfirmasi | Diproses | Selesai | Dibatalkan)
- created_at, updated_at

### Notifications

- id, user_id, title, message, is_read
- created_at

## 🔒 Security

- ✅ Helmet.js untuk security headers
- ✅ CORS protection
- ✅ Password hashing dengan bcrypt (12 rounds)
- ✅ JWT authentication
- ✅ Input validation dengan Zod
- ✅ SQL injection protection (prepared statements)
- ✅ Rate limiting (recommended untuk production)

## 📝 Logging

Menggunakan **Pino** untuk structured logging:

- Development: Pretty printed dengan colors
- Production: JSON format untuk log aggregation

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## Happy Coding!✨🚀
