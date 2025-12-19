-- ============================================
-- DANUS. IN DATABASE SCHEMA
-- Platform Pre-Order untuk Mahasiswa
-- ============================================

DROP DATABASE IF EXISTS danusin_db;

CREATE DATABASE danusin_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE danusin_db;

-- ============================================
-- TABLE: users
-- ============================================
CREATE TABLE users (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  nim VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  major VARCHAR(255) NOT NULL,
  faculty VARCHAR(255) NOT NULL,
  batch_year YEAR NOT NULL,
  whatsapp VARCHAR(20) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('buyer', 'seller') NOT NULL DEFAULT 'buyer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_nim (nim),
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: stores
-- Menyimpan data toko seller
-- ============================================
CREATE TABLE stores (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL UNIQUE,
  store_name VARCHAR(255) NOT NULL,
  description TEXT,
  whatsapp VARCHAR(20) NOT NULL,
  pickup_locations JSON COMMENT '["Kampus A", "Kampus B"]',
  available_days JSON COMMENT '["Senin", "Selasa", ...]',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: products
-- ============================================
CREATE TABLE products (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  seller_id INT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price INT UNSIGNED NOT NULL,
  stock INT UNSIGNED NOT NULL DEFAULT 0,
  pickup_locations JSON COMMENT '["Kampus A", "Kampus B"]',
  available_days JSON COMMENT '["Senin", "Selasa", ...]',
  po_open_date DATE NOT NULL,
  po_close_date DATE NOT NULL,
  delivery_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_seller (seller_id),
  INDEX idx_dates (po_open_date, po_close_date),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: images
-- ============================================
CREATE TABLE images (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(255),
  entity_type ENUM('product', 'user', 'store') NOT NULL DEFAULT 'product',
  entity_id INT UNSIGNED NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_primary (entity_type, entity_id, is_primary)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE:  orders
-- ============================================
CREATE TABLE orders (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  buyer_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  seller_id INT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  total_price INT UNSIGNED NOT NULL,
  pickup_location VARCHAR(255),
  pickup_day VARCHAR(50),
  notes TEXT,
  status ENUM('Menunggu Konfirmasi', 'Diproses', 'Selesai', 'Dibatalkan') NOT NULL DEFAULT 'Menunggu Konfirmasi',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_buyer (buyer_id),
  INDEX idx_seller (seller_id),
  INDEX idx_status (status),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: notifications
-- ============================================
CREATE TABLE notifications (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('order', 'system', 'promo') NOT NULL DEFAULT 'system',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SAMPLE DATA
-- ============================================

-- Users (password:  password123)
INSERT INTO users (nim, name, major, faculty, batch_year, whatsapp, email, password, role) VALUES
('2108107010001', 'Budi Santoso', 'Informatika', 'Teknik', 2021, '6281234567890', 'budi@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4. VTtYqVqQHqKGJW', 'seller'),
('2108107010002', 'Siti Aminah', 'Sistem Informasi', 'Teknik', 2021, '6281234567891', 'siti@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYqVqQHqKGJW', 'buyer'),
('2108107010003', 'Ahmad Fadli', 'Teknik Elektro', 'Teknik', 2022, '6281234567892', 'ahmad@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYqVqQHqKGJW', 'seller'),
('2108107010004', 'Alief FNR', 'Informatika', 'Teknik', 2021, '6281234567893', 'alief@example. com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYqVqQHqKGJW', 'buyer');

-- Stores
INSERT INTO stores (user_id, store_name, description, whatsapp, pickup_locations, available_days) VALUES
(1, 'Dapur Budi', 'Jajanan homemade berkualitas', '6281234567890', '["Kampus A", "Kampus B"]', '["Senin", "Selasa", "Rabu", "Kamis", "Jumat"]'),
(3, 'Ahmad Kitchen', 'Makanan enak harga mahasiswa', '6281234567892', '["Kampus A"]', '["Senin", "Rabu", "Jumat"]');

-- Products
INSERT INTO products (seller_id, name, description, price, stock, pickup_locations, available_days, po_open_date, po_close_date, delivery_date) VALUES
(1, 'Mochi Aneka Rasa', 'Mochi lembut dengan isian strawberry segar.  Dibuat dengan bahan berkualitas. ', 5000, 20, '["Kampus A", "Kampus B"]', '["Senin", "Selasa", "Rabu", "Kamis", "Jumat"]', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 7 DAY), DATE_ADD(CURDATE(), INTERVAL 10 DAY)),
(1, 'Risol Mayo', 'Risol isi mayo dan sayuran segar, crispy dan lezat! ', 3000, 50, '["Kampus A"]', '["Senin", "Rabu", "Jumat"]', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 5 DAY), DATE_ADD(CURDATE(), INTERVAL 7 DAY)),
(3, 'Nasi Kulit Crispy', 'Nasi dengan kulit ayam crispy, sambal matah. ', 15000, 30, '["Kampus A"]', '["Senin", "Rabu", "Jumat"]', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 3 DAY), DATE_ADD(CURDATE(), INTERVAL 5 DAY)),
(3, 'Dimsum Ayam', 'Dimsum ayam homemade dengan saus spesial.  Isi 5 pcs.', 12000, 25, '["Kampus A", "Kampus B"]', '["Senin", "Selasa", "Rabu", "Kamis", "Jumat"]', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 10 DAY), DATE_ADD(CURDATE(), INTERVAL 14 DAY)),
(1, 'Brownies Panggang', 'Brownies coklat panggang dengan topping keju. ', 25000, 15, '["Kampus A", "Kampus B"]', '["Senin", "Selasa", "Rabu", "Kamis", "Jumat"]', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 7 DAY), DATE_ADD(CURDATE(), INTERVAL 10 DAY)),
(3, 'Es Kopi Susu', 'Es kopi susu gula aren, fresh dan creamy.  500ml.', 8000, 40, '["Kampus A"]', '["Senin", "Rabu", "Jumat"]', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 2 DAY), DATE_ADD(CURDATE(), INTERVAL 3 DAY));

-- Images
INSERT INTO images (url, alt_text, entity_type, entity_id, is_primary, sort_order) VALUES
('https://images.unsplash. com/photo-1558961363-fa8fdf82db35?w=500', 'Mochi', 'product', 1, TRUE, 0),
('https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500', 'Mochi 2', 'product', 1, FALSE, 1),
('https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=500', 'Risol', 'product', 2, TRUE, 0),
('https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500', 'Nasi Kulit', 'product', 3, TRUE, 0),
('https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=500', 'Dimsum', 'product', 4, TRUE, 0),
('https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500', 'Brownies', 'product', 5, TRUE, 0),
('https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500', 'Kopi', 'product', 6, TRUE, 0);

-- Orders
INSERT INTO orders (buyer_id, product_id, seller_id, quantity, total_price, pickup_location, pickup_day, status, created_at) VALUES
(2, 1, 1, 2, 10000, 'Kampus A', 'Senin', 'Selesai', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(2, 3, 3, 1, 15000, 'Kampus A', 'Rabu', 'Diproses', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(2, 5, 1, 2, 50000, 'Kampus B', 'Jumat', 'Selesai', DATE_SUB(NOW(), INTERVAL 10 DAY)),
(4, 1, 1, 2, 10000, 'Kampus A', 'Senin', 'Selesai', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(4, 4, 3, 1, 12000, 'Kampus A', 'Rabu', 'Menunggu Konfirmasi', NOW());

-- Notifications
INSERT INTO notifications (user_id, title, message, type, is_read) VALUES
(2, 'Pesanan Dikonfirmasi', 'Pesanan Mochi Anda telah dikonfirmasi. ', 'order', FALSE),
(2, 'Pesanan Selesai', 'Pesanan Brownies Anda sudah selesai. ', 'order', TRUE),
(1, 'Pesanan Baru', 'Anda mendapat pesanan baru untuk Mochi (2 pcs).', 'order', FALSE);

SELECT 'Database berhasil dibuat!' AS status;
