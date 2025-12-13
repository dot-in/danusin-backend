import { pool } from "../../core/config/database.config.js";
import { AppError } from "../../core/middlewares/error.middleware.js";
import { UserRow, StoreRow, UserOrderRow, ImageRow } from "../../shared/types/database.types.js";
import { ERROR_MESSAGES } from "../../shared/constants/message.constant.js";
import bcrypt from "bcrypt";

export class UserService {
  // Get public profile (existing)
  async getPublicProfile(userId: number) {
    const [users] = await pool. query<UserRow[]>(
      `SELECT
        u.id,
        u. name,
        u.faculty,
        u.batch_year,
        u.profile_image,
        COUNT(p.id) as active_products_count
       FROM users u
       LEFT JOIN products p ON u.id = p.seller_id AND p.po_close_date >= CURDATE()
       WHERE u.id = ?  AND u.role = 'seller'
       GROUP BY u.id`,
      [userId]
    );

    if (users.length === 0) {
      throw new AppError(ERROR_MESSAGES.USER. NOT_FOUND, 404);
    }

    return users[0];
  }

  // Get current user profile
  async getMyProfile(userId: number) {
    const [users] = await pool.query<UserRow[]>(
      `SELECT id, nim, name, email, whatsapp, major, faculty, batch_year, role, created_at
       FROM users WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      throw new AppError(ERROR_MESSAGES.USER.NOT_FOUND, 404);
    }

    // Get profile image from images table
    const [images] = await pool.query<ImageRow[]>(
      `SELECT url FROM images WHERE entity_type = 'user' AND entity_id = ? AND is_primary = TRUE LIMIT 1`,
      [userId]
    );

    const profileImage = images.length > 0 ? images[0].url : null;

    // Mask sensitive data
    const user = users[0];
    return {
      ...user,
      profile_image: profileImage,
      email: this.maskEmail(user.email),
      whatsapp: user.whatsapp ? this.maskPhone(user.whatsapp) : null,
    };
  }

  // Update profile
  async updateProfile(userId: number, data: {
    name?: string;
    whatsapp?: string;
    faculty?: string;
    batch_year?: number;
  }) {
    const updateFields: string[] = [];
    const values: any[] = [];

    if (data.name) {
      updateFields.push("name = ?");
      values.push(data.name);
    }
    if (data.whatsapp) {
      updateFields.push("whatsapp = ?");
      values.push(data.whatsapp);
    }
    if (data.faculty) {
      updateFields.push("faculty = ?");
      values.push(data.faculty);
    }
    if (data.batch_year) {
      updateFields.push("batch_year = ?");
      values.push(data.batch_year);
    }

    if (updateFields.length === 0) {
      throw new AppError("Tidak ada data yang diperbarui", 400);
    }

    updateFields.push("updated_at = NOW()");
    values.push(userId);

    await pool.query(
      `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`,
      values
    );

    return this.getMyProfile(userId);
  }

  // Update profile image
  async updateProfileImage(userId: number, imageUrl: string) {
    // Check if user already has a profile image in the images table
    const [existingImage] = await pool.query<ImageRow[]>(
      `SELECT id FROM images WHERE entity_type = 'user' AND entity_id = ? AND is_primary = TRUE`,
      [userId]
    );

    if (existingImage.length > 0) {
      // Update existing profile image
      await pool.query(
        `UPDATE images SET url = ? WHERE id = ?`,
        [imageUrl, existingImage[0].id]
      );
    } else {
      // Insert new profile image
      await pool.query(
        `INSERT INTO images (url, alt_text, entity_type, entity_id, is_primary, sort_order)
         VALUES (?, 'Profile image', 'user', ?, TRUE, 0)`,
        [imageUrl, userId]
      );
    }

    return this.getMyProfile(userId);
  }

  // Update email
  async updateEmail(userId: number, email: string, password: string) {
    // Verify password first
    const [users] = await pool.query<UserRow[]>(
      `SELECT password FROM users WHERE id = ? `,
      [userId]
    );

    if (users. length === 0) {
      throw new AppError(ERROR_MESSAGES.USER. NOT_FOUND, 404);
    }

    const isPasswordValid = await bcrypt.compare(password, users[0]. password);
    if (!isPasswordValid) {
      throw new AppError("Password tidak valid", 401);
    }

    // Check if email already exists
    const [existingEmail] = await pool. query<UserRow[]>(
      `SELECT id FROM users WHERE email = ?  AND id != ?`,
      [email, userId]
    );

    if (existingEmail.length > 0) {
      throw new AppError("Email sudah digunakan", 409);
    }

    await pool.query(
      `UPDATE users SET email = ?, updated_at = NOW() WHERE id = ?`,
      [email, userId]
    );

    return { message: "Email berhasil diperbarui" };
  }

  // Update whatsapp
  async updatePhone(userId: number, phone: string) {
    await pool.query(
      `UPDATE users SET whatsapp = ?, updated_at = NOW() WHERE id = ?`,
      [phone, userId]
    );

    return { message: "Nomor telepon berhasil diperbarui" };
  }

  // Change password
  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const [users] = await pool.query<UserRow[]>(
      `SELECT password FROM users WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      throw new AppError(ERROR_MESSAGES.USER.NOT_FOUND, 404);
    }

    const isPasswordValid = await bcrypt. compare(currentPassword, users[0].password);
    if (!isPasswordValid) {
      throw new AppError("Password saat ini tidak valid", 401);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await pool.query(
      `UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?`,
      [hashedPassword, userId]
    );

    return { message: "Password berhasil diperbarui" };
  }

  // Get user orders
  async getUserOrders(userId: number, options: {
    page:  number;
    limit:  number;
    status?: string;
  }) {
    const offset = (options.page - 1) * options.limit;
    let whereClause = "WHERE o.buyer_id = ?";
    const params:  any[] = [userId];

    if (options.status) {
      whereClause += " AND o. status = ?";
      params.push(options.status);
    }

    const [orders] = await pool.query<UserOrderRow[]>(
      `SELECT
        o.id,
        o.status,
        o. total_amount,
        o.created_at,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'product_id', oi.product_id,
            'product_name', p.name,
            'product_image', p.image_url,
            'quantity', oi.quantity,
            'price', oi.price,
            'subtotal', oi. quantity * oi.price,
            'pickup_day', p.pickup_day,
            'pickup_location', p.pickup_location,
            'store_name', s.store_name
          )
        ) as items
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       JOIN products p ON oi.product_id = p.id
       JOIN stores s ON p. seller_id = s.user_id
       ${whereClause}
       GROUP BY o. id
       ORDER BY o. created_at DESC
       LIMIT ?  OFFSET ?`,
      [... params, options.limit, offset]
    );

    const [countResult] = await pool. query<any[]>(
      `SELECT COUNT(DISTINCT o.id) as total FROM orders o ${whereClause}`,
      params
    );

    return {
      orders: orders.map((order) => ({
        ...order,
        items: typeof order.items === 'string' ? JSON.parse(order. items) : order.items
      })),
      pagination: {
        page: options.page,
        limit: options.limit,
        total: countResult[0]. total,
        totalPages: Math.ceil(countResult[0].total / options. limit),
      },
    };
  }

  // Create store (upgrade to seller)
  async createStore(userId: number, data:  {
    store_name: string;
    whatsapp:  string;
    email: string;
    student_proof_url: string;
    store_image?:  string;
  }) {
    // Check if user already has a store
    const [existingStore] = await pool. query<StoreRow[]>(
      `SELECT id FROM stores WHERE user_id = ? `,
      [userId]
    );

    if (existingStore.length > 0) {
      throw new AppError("Anda sudah memiliki toko", 409);
    }

    // Create store
    const [result] = await pool. query<any>(
      `INSERT INTO stores (user_id, store_name, whatsapp, email, student_proof_url, store_image, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [userId, data.store_name, data.whatsapp, data.email, data.student_proof_url, data.store_image || null]
    );

    // Update user role to seller (pending verification)
    await pool.query(
      `UPDATE users SET role = 'seller', updated_at = NOW() WHERE id = ?`,
      [userId]
    );

    return {
      id: result.insertId,
      message: "Toko berhasil dibuat dan menunggu verifikasi",
    };
  }

  // Get user's store
  async getMyStore(userId: number) {
    const [stores] = await pool.query<StoreRow[]>(
      `SELECT * FROM stores WHERE user_id = ? `,
      [userId]
    );

    if (stores. length === 0) {
      return null;
    }

    return stores[0];
  }

  // Helper methods
  private maskEmail(email: string): string {
    const [localPart, domain] = email.split("@");
    const maskedLocal = localPart. charAt(0) + "*".repeat(localPart.length - 1);
    return `${maskedLocal}@${domain}`;
  }

  private maskPhone(phone: string): string {
    return phone.slice(0, 4) + "*".repeat(phone. length - 6) + phone.slice(-2);
  }
}
