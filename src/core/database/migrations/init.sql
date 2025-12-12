-- ============================================
-- DANUS. IN DATABASE SCHEMA
-- Platform Pre-Order untuk Mahasiswa
-- ============================================

-- Drop database jika ingin reset (HATI-HATI di production!)
-- DROP DATABASE IF EXISTS danusin_db;

-- Create database
CREATE DATABASE IF NOT EXISTS danusin_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE danusin_db;

-- ============================================
-- TABLE: users
-- Menyimpan data pengguna (buyer & seller)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  nim VARCHAR(20) UNIQUE NOT NULL COMMENT 'Nomor Induk Mahasiswa',
  name VARCHAR(255) NOT NULL COMMENT 'Nama lengkap',
  major VARCHAR(255) NOT NULL COMMENT 'Program studi/jurusan',
  faculty VARCHAR(255) NOT NULL COMMENT 'Fakultas',
  batch_year YEAR NOT NULL COMMENT 'Tahun angkatan',
  whatsapp VARCHAR(20) NOT NULL COMMENT 'Nomor WhatsApp (format: 628xxx)',
  email VARCHAR(255) UNIQUE NOT NULL COMMENT 'Email (untuk login)',
  password VARCHAR(255) NOT NULL COMMENT 'Password (hashed)',
  role ENUM('buyer', 'seller') NOT NULL DEFAULT 'buyer' COMMENT 'Role pengguna',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_nim (nim),
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: products
-- Menyimpan data produk pre-order
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  seller_id INT UNSIGNED NOT NULL COMMENT 'ID penjual (FK ke users)',
  name VARCHAR(255) NOT NULL COMMENT 'Nama produk',
  description TEXT COMMENT 'Deskripsi produk',
  price INT UNSIGNED NOT NULL COMMENT 'Harga dalam Rupiah',
  stock INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Jumlah stok tersedia',
  po_open_date DATE NOT NULL COMMENT 'Tanggal buka pre-order',
  po_close_date DATE NOT NULL COMMENT 'Tanggal tutup pre-order',
  delivery_date DATE COMMENT 'Tanggal pengambilan/pengiriman',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,

  INDEX idx_seller (seller_id),
  INDEX idx_dates (po_open_date, po_close_date),
  INDEX idx_name (name),
  INDEX idx_price (price)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: images
-- Menyimpan gambar (polymorphic - bisa untuk product/user)
-- ============================================
CREATE TABLE IF NOT EXISTS images (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  url VARCHAR(500) NOT NULL COMMENT 'URL gambar',
  alt_text VARCHAR(255) COMMENT 'Alt text untuk accessibility',
  entity_type ENUM('product', 'user') NOT NULL DEFAULT 'product' COMMENT 'Tipe entity pemilik gambar',
  entity_id INT UNSIGNED NOT NULL COMMENT 'ID entity (product_id atau user_id)',
  is_primary BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Apakah gambar utama',
  sort_order INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Urutan gambar',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_primary (entity_type, entity_id, is_primary),
  INDEX idx_sort (entity_type, entity_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: orders
-- Menyimpan data pesanan
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  buyer_id INT UNSIGNED NOT NULL COMMENT 'ID pembeli (FK ke users)',
  product_id INT UNSIGNED NOT NULL COMMENT 'ID produk (FK ke products)',
  quantity INT UNSIGNED NOT NULL COMMENT 'Jumlah pesanan',
  total_price INT UNSIGNED NOT NULL COMMENT 'Total harga (price x quantity)',
  status ENUM('Menunggu Konfirmasi', 'Diproses', 'Selesai', 'Dibatalkan')
    NOT NULL DEFAULT 'Menunggu Konfirmasi' COMMENT 'Status pesanan',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,

  INDEX idx_buyer (buyer_id),
  INDEX idx_product (product_id),
  INDEX idx_status (status),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: notifications
-- Menyimpan notifikasi untuk pengguna
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL COMMENT 'ID penerima notifikasi',
  title VARCHAR(255) NOT NULL COMMENT 'Judul notifikasi',
  message TEXT NOT NULL COMMENT 'Isi pesan notifikasi',
  is_read BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Status sudah dibaca',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  INDEX idx_user (user_id),
  INDEX idx_read (is_read),
  INDEX idx_user_read (user_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SAMPLE DATA (untuk testing)
-- ============================================

-- Insert sample users
-- Password: password123 (hashed dengan bcrypt)
INSERT INTO users (nim, name, major, faculty, batch_year, whatsapp, email, password, role) VALUES
('2108107010001', 'Budi Santoso', 'Informatika', 'Teknik', 2021, '6281234567890', 'budi@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4. VTtYqVqQHqKGJW', 'seller'),
('2108107010002', 'Siti Aminah', 'Sistem Informasi', 'Teknik', 2021, '6281234567891', 'siti@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4. VTtYqVqQHqKGJW', 'buyer'),
('2108107010003', 'Ahmad Fadli', 'Teknik Elektro', 'Teknik', 2022, '6281234567892', 'ahmad@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYqVqQHqKGJW', 'seller');

-- Insert sample products
INSERT INTO products (seller_id, name, description, price, stock, po_open_date, po_close_date, delivery_date) VALUES
(1, 'Mochi Aneka Rasa', 'Mochi lembut dengan isian strawberry segar.  Dibuat dengan bahan berkualitas dan higienis.  Cocok untuk camilan atau dessert. ', 5000, 20, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 7 DAY), DATE_ADD(CURDATE(), INTERVAL 10 DAY)),
(1, 'Risol Mayo', 'Risol isi mayo dan sayuran segar, crispy dan lezat! ', 3000, 50, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 5 DAY), DATE_ADD(CURDATE(), INTERVAL 7 DAY)),
(3, 'Nasi Kulit Crispy', 'Nasi dengan kulit ayam crispy, sambal matah, dan lalapan segar. ', 15000, 30, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 3 DAY), DATE_ADD(CURDATE(), INTERVAL 5 DAY)),
(3, 'Dimsum Ayam', 'Dimsum ayam homemade dengan saus spesial.  Isi 5 pcs.', 12000, 25, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 10 DAY), DATE_ADD(CURDATE(), INTERVAL 14 DAY)),
(1, 'Brownies Panggang', 'Brownies coklat panggang dengan topping keju.  Ukuran 10x10 cm.', 25000, 15, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 7 DAY), DATE_ADD(CURDATE(), INTERVAL 10 DAY)),
(3, 'Es Kopi Susu', 'Es kopi susu gula aren, fresh dan creamy. Ukuran 500ml.', 8000, 40, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 2 DAY), DATE_ADD(CURDATE(), INTERVAL 3 DAY));

-- Insert sample images for products
INSERT INTO images (url, alt_text, entity_type, entity_id, is_primary, sort_order) VALUES
-- Product 1: Mochi (multiple images)
('https://images.unsplash. com/photo-1558961363-fa8fdf82db35?w=500', 'Mochi Strawberry', 'product', 1, TRUE, 0),
('https://images. unsplash.com/photo-1563805042-7684c019e1cb?w=500', 'Mochi Coklat', 'product', 1, FALSE, 1),
('https://images.unsplash. com/photo-1551024506-0bccd828d307?w=500', 'Mochi Matcha', 'product', 1, FALSE, 2),
-- Product 2: Risol Mayo
('https://images. unsplash.com/photo-1604908176997-125f25cc6f3d?w=500', 'Risol Mayo', 'product', 2, TRUE, 0),
-- Product 3: Nasi Kulit
('https://images. unsplash.com/photo-1512058564366-18510be2db19?w=500', 'Nasi Kulit Crispy', 'product', 3, TRUE, 0),
('https://images.unsplash.com/photo-1569058242567-93de6f36f8eb?w=500', 'Nasi Kulit Close Up', 'product', 3, FALSE, 1),
-- Product 4: Dimsum
('https://images. unsplash.com/photo-1496116218417-1a781b1c416c?w=500', 'Dimsum Ayam', 'product', 4, TRUE, 0),
-- Product 5: Brownies
('https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500', 'Brownies Panggang', 'product', 5, TRUE, 0),
('https://images.unsplash.com/photo-1515037893149-de7f840978e2?w=500', 'Brownies Slice', 'product', 5, FALSE, 1),
-- Product 6: Es Kopi
('https://images. unsplash.com/photo-1461023058943-07fcbe16d735?w=500', 'Es Kopi Susu', 'product', 6, TRUE, 0);

-- Insert sample orders
INSERT INTO orders (buyer_id, product_id, quantity, total_price, status) VALUES
(2, 1, 3, 15000, 'Menunggu Konfirmasi'),
(2, 3, 1, 15000, 'Diproses'),
(2, 5, 2, 50000, 'Selesai');

-- Insert sample notifications
INSERT INTO notifications (user_id, title, message, is_read) VALUES
(2, 'Pesanan Dikonfirmasi', 'Pesanan Mochi Aneka Rasa Anda telah dikonfirmasi oleh penjual. ', FALSE),
(2, 'Pesanan Siap Diambil', 'Pesanan Nasi Kulit Crispy Anda sudah siap diambil.', FALSE),
(1, 'Pesanan Baru', 'Anda mendapat pesanan baru untuk Mochi Aneka Rasa (3 pcs). ', TRUE);

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 'Database danusin_db berhasil dibuat!' AS status;
SELECT TABLE_NAME, TABLE_ROWS FROM information_schema. TABLES WHERE TABLE_SCHEMA = 'danusin_db';
