import { pool } from "../../core/config/database.config.js";
import { AppError } from "../../core/middlewares/error.middleware.js";
import { StoreRow, UserRow } from "../../shared/types/database.types.js";
import { generateToken } from "../../shared/utils/jwt.util.js";
import type { ResultSetHeader } from "mysql2";

export class StoreService {
  async getMyStore(userId: number) {
    const [stores] = await pool.query<StoreRow[]>("SELECT * FROM stores WHERE user_id = ?", [userId]);
    if (stores.length === 0) return null;

    const store = stores[0];
    return {
      ...store,
      pickup_locations: store.pickup_locations ? JSON.parse(store.pickup_locations) : [],
      available_days: store.available_days ? JSON.parse(store.available_days) : [],
    };
  }

  async createStore(userId: number, data: { store_name: string; description?: string; whatsapp: string }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [existing] = await connection.query<StoreRow[]>("SELECT id FROM stores WHERE user_id = ?", [userId]);
      if (existing.length > 0) throw new AppError("Anda sudah memiliki toko", 409);

      const [result] = await connection.query<ResultSetHeader>(
        "INSERT INTO stores (user_id, store_name, description, whatsapp, created_at) VALUES (?, ?, ?, ?, NOW())",
        [userId, data.store_name, data.description || null, data.whatsapp]
      );

      await connection.query("UPDATE users SET role = 'seller', updated_at = NOW() WHERE id = ?", [userId]);

      const [users] = await connection.query<UserRow[]>("SELECT id, nim, name, email, role FROM users WHERE id = ?", [userId]);
      const user = users[0];

      const token = generateToken({ id: user.id, nim: user.nim, name: user.name, email: user.email, role: user.role });

      await connection.commit();
      return {
        id: result.insertId,
        store_name: data.store_name,
        description: data.description || null,
        whatsapp: data.whatsapp,
        message: "Toko berhasil dibuat",
        token,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async updateStore(userId: number, data: {
    store_name?: string;
    description?: string;
    whatsapp?: string;
    pickup_locations?: string[];
    available_days?: string[];
    is_active?: boolean;
  }) {
    const [stores] = await pool.query<StoreRow[]>("SELECT id FROM stores WHERE user_id = ?", [userId]);
    if (stores.length === 0) throw new AppError("Toko tidak ditemukan", 404);

    const fields: string[] = [];
    const values: any[] = [];

    if (data.store_name) { fields.push("store_name = ?"); values.push(data.store_name); }
    if (data.description !== undefined) { fields.push("description = ?"); values.push(data.description); }
    if (data.whatsapp) { fields.push("whatsapp = ?"); values.push(data.whatsapp); }
    if (data.pickup_locations) { fields.push("pickup_locations = ?"); values.push(JSON.stringify(data.pickup_locations)); }
    if (data.available_days) { fields.push("available_days = ?"); values.push(JSON.stringify(data.available_days)); }
    if (data.is_active !== undefined) { fields.push("is_active = ?"); values.push(data.is_active); }

    if (fields.length === 0) throw new AppError("Tidak ada data yang diperbarui", 400);

    fields.push("updated_at = NOW()");
    values.push(stores[0].id);

    await pool.query(`UPDATE stores SET ${fields.join(", ")} WHERE id = ?`, values);
    return this.getMyStore(userId);
  }

  async getStoreById(storeId: number) {
    const [stores] = await pool.query<StoreRow[]>(
      `SELECT s.*, u.name as owner_name, u.faculty, u.batch_year
       FROM stores s JOIN users u ON s.user_id = u.id
       WHERE s.id = ? AND s.is_active = TRUE`,
      [storeId]
    );

    if (stores.length === 0) throw new AppError("Toko tidak ditemukan", 404);
    const store = stores[0] as any;

    return {
      ...store,
      pickup_locations: store.pickup_locations ? JSON.parse(store.pickup_locations) : [],
      available_days: store.available_days ? JSON.parse(store.available_days) : [],
    };
  }
}
