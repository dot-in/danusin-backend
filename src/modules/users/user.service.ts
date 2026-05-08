import { pool } from "../../core/config/database.config.js";
import { AppError } from "../../core/middlewares/error.middleware.js";
import { UserRow, StoreRow, ImageRow } from "../../shared/types/database.types.js";
import { ERROR_MESSAGES } from "../../shared/constants/message.constant.js";
import { hashPassword, comparePassword } from "../../shared/utils/bcrypt.util.js";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

interface UserOrderRow extends RowDataPacket {
  id: number;
  product_id: number;
  product_name: string;
  product_image: string | null;
  quantity: number;
  total_price: number;
  status: string;
  pickup_location: string | null;
  pickup_day: string | null;
  seller_name: string;
  store_name: string | null;
  created_at: string;
}

export class UserService {
  async getPublicProfile(userId: number) {
    const [users] = await pool.query<any[]>(
      `SELECT u.id, u.name, u.faculty, u.batch_year, u.major,
              COUNT(p.id) as active_products_count,
              img.url as profile_image,
              s.store_name, s.description as store_description
       FROM users u
       LEFT JOIN products p ON u.id = p.seller_id AND p.is_active = TRUE AND p.po_close_date >= CURDATE()
       LEFT JOIN images img ON img.entity_type = 'user' AND img.entity_id = u.id AND img.is_primary = TRUE
       LEFT JOIN stores s ON u.id = s.user_id AND s.is_active = TRUE
       WHERE u.id = ? AND u.role = 'seller'
       GROUP BY u.id, img.url, s.store_name, s.description`,
      [userId]
    );

    if (users.length === 0) throw new AppError(ERROR_MESSAGES.USER.NOT_FOUND, 404);
    return users[0];
  }

  async getMyProfile(userId: number) {
    const [users] = await pool.query<any[]>(
      `SELECT u.id, u.nim, u.name, u.email, u.whatsapp, u.major, u.faculty, u.batch_year, u.role, u.created_at,
              img.url as profile_image
       FROM users u
       LEFT JOIN images img ON img.entity_type = 'user' AND img.entity_id = u.id AND img.is_primary = TRUE
       WHERE u.id = ?`,
      [userId]
    );

    if (users.length === 0) throw new AppError(ERROR_MESSAGES.USER.NOT_FOUND, 404);
    const user = users[0];
    return {
      ...user,
      email: this.maskEmail(user.email),
      whatsapp: user.whatsapp ? this.maskPhone(user.whatsapp) : null,
    };
  }

  async updateProfile(userId: number, data: { name?: string; whatsapp?: string; faculty?: string; batch_year?: number }) {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) throw new AppError("Tidak ada data yang diperbarui", 400);
    fields.push("updated_at = NOW()");
    values.push(userId);

    await pool.query(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, values);
    return this.getMyProfile(userId);
  }

  async updateProfileImage(userId: number, imageUrl: string) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [existing] = await conn.query<ImageRow[]>(
        "SELECT id FROM images WHERE entity_type = 'user' AND entity_id = ? AND is_primary = TRUE",
        [userId]
      );

      if (existing.length > 0) {
        await conn.query("UPDATE images SET url = ? WHERE id = ?", [imageUrl, existing[0].id]);
      } else {
        await conn.query(
          "INSERT INTO images (url, alt_text, entity_type, entity_id, is_primary, sort_order) VALUES (?, 'Profile image', 'user', ?, TRUE, 0)",
          [imageUrl, userId]
        );
      }
      await conn.commit();
      return this.getMyProfile(userId);
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  async updateEmail(userId: number, email: string, password: string) {
    const [users] = await pool.query<UserRow[]>("SELECT password FROM users WHERE id = ?", [userId]);
    if (users.length === 0) throw new AppError(ERROR_MESSAGES.USER.NOT_FOUND, 404);

    if (!(await comparePassword(password, users[0].password))) throw new AppError("Password tidak valid", 401);

    const [existing] = await pool.query<UserRow[]>("SELECT id FROM users WHERE email = ? AND id != ?", [email, userId]);
    if (existing.length > 0) throw new AppError("Email sudah digunakan", 409);

    await pool.query("UPDATE users SET email = ?, updated_at = NOW() WHERE id = ?", [email, userId]);
    return { message: "Email berhasil diperbarui" };
  }

  async updatePhone(userId: number, phone: string) {
    await pool.query("UPDATE users SET whatsapp = ?, updated_at = NOW() WHERE id = ?", [phone, userId]);
    return { message: "Nomor telepon berhasil diperbarui" };
  }

  async changePassword(userId: number, current: string, next: string) {
    const [users] = await pool.query<UserRow[]>("SELECT password FROM users WHERE id = ?", [userId]);
    if (users.length === 0) throw new AppError(ERROR_MESSAGES.USER.NOT_FOUND, 404);

    if (!(await comparePassword(current, users[0].password))) throw new AppError("Password saat ini tidak valid", 401);

    const hashed = await hashPassword(next);
    await pool.query("UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?", [hashed, userId]);
    return { message: "Password berhasil diperbarui" };
  }

  async getUserOrders(userId: number, options: { page: number; limit: number; status?: string }) {
    const offset = (options.page - 1) * options.limit;
    let where = "WHERE o.buyer_id = ?";
    const params: any[] = [userId];

    if (options.status) {
      where += " AND o.status = ?";
      params.push(options.status);
    }

    const [orders] = await pool.query<UserOrderRow[]>(
      `SELECT o.id, o.product_id, o.quantity, o.total_price, o.status, o.pickup_location, o.pickup_day, o.created_at,
              p.name as product_name, img.url as product_image, u.name as seller_name, s.store_name
       FROM orders o
       LEFT JOIN products p ON o.product_id = p.id
       LEFT JOIN images img ON img.entity_type = 'product' AND img.entity_id = p.id AND img.is_primary = TRUE
       LEFT JOIN users u ON o.seller_id = u.id
       LEFT JOIN stores s ON o.seller_id = s.user_id
       ${where}
       ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
      [...params, options.limit, offset]
    );

    const [count] = await pool.query<any[]>(`SELECT COUNT(*) as total FROM orders o ${where}`, params);

    return {
      orders,
      pagination: {
        page: options.page,
        limit: options.limit,
        total: count[0].total,
        totalPages: Math.ceil(count[0].total / options.limit),
      },
    };
  }

  async createStore(userId: number, data: { store_name: string; description?: string; whatsapp: string }) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [existing] = await conn.query<StoreRow[]>("SELECT id FROM stores WHERE user_id = ?", [userId]);
      if (existing.length > 0) throw new AppError("Anda sudah memiliki toko", 409);

      const [result] = await conn.query<ResultSetHeader>(
        "INSERT INTO stores (user_id, store_name, description, whatsapp, created_at) VALUES (?, ?, ?, ?, NOW())",
        [userId, data.store_name, data.description || null, data.whatsapp]
      );

      await conn.query("UPDATE users SET role = 'seller', updated_at = NOW() WHERE id = ?", [userId]);
      await conn.commit();

      return { id: result.insertId, message: "Toko berhasil dibuat" };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  async getMyStore(userId: number) {
    const [stores] = await pool.query<StoreRow[]>("SELECT * FROM stores WHERE user_id = ?", [userId]);
    return stores.length === 0 ? null : stores[0];
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split("@");
    return `${local.charAt(0)}${"*".repeat(local.length - 1)}@${domain}`;
  }

  private maskPhone(phone: string): string {
    if (phone.length <= 6) return phone;
    return `${phone.slice(0, 4)}${"*".repeat(phone.length - 6)}${phone.slice(-2)}`;
  }
}
