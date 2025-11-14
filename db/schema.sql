CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nim VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150),
  major VARCHAR(150),
  faculty VARCHAR(150),
  batch_year INT,
  whatsapp VARCHAR(30),
  email VARCHAR(150),
  password VARCHAR(255),
  role VARCHAR(20) COMMENT 'buyer | seller',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_role (role),
  INDEX idx_batch (batch_year)
);

CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  seller_id INT NOT NULL,
  name VARCHAR(150),
  description TEXT,
  price INT,
  image_url VARCHAR(255),
  po_open_date DATE,
  po_close_date DATE,
  delivery_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  buyer_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT,
  total_price INT,
  status VARCHAR(50) COMMENT 'Menunggu Pembayaran | Diproses | Siap Diambil | Selesai | Dibatalkan',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  title VARCHAR(150),
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);