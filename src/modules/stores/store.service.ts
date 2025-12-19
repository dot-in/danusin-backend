import { pool } from "../../core/config/database.config.js";
import { AppError } from "../../core/middlewares/error.middleware.js";
import { StoreRow, UserRow } from "../../shared/types/database.types.js";
import { generateToken } from "../../shared/utils/jwt.util.js";

export class StoreService {
  // Get current user's store
  async getMyStore(userId: number) {
    const [stores] = await pool.query<StoreRow[]>(
      `SELECT * FROM stores WHERE user_id = ?`,
      [userId]
    );

    if (stores.length === 0) {
      return null;
    }

    const store = stores[0];
    return {
      id: store.id,
      user_id: store.user_id,
      store_name: store.store_name,
      description: store.description,
      whatsapp: store.whatsapp,
      pickup_locations: store.pickup_locations
        ? JSON.parse(store.pickup_locations)
        : [],
      available_days: store.available_days
        ? JSON.parse(store.available_days)
        : [],
      is_active: store.is_active,
      created_at: store.created_at,
      updated_at: store.updated_at,
    };
  }

  // Create store (upgrade to seller)
  async createStore(
    userId: number,
    data: {
      store_name: string;
      description?: string;
      whatsapp: string;
    }
  ) {
    // Check if user already has a store
    const [existingStore] = await pool.query<StoreRow[]>(
      `SELECT id FROM stores WHERE user_id = ?`,
      [userId]
    );

    if (existingStore.length > 0) {
      throw new AppError("Anda sudah memiliki toko", 409);
    }

    // Create store
    const [result] = await pool.query<any>(
      `INSERT INTO stores (user_id, store_name, description, whatsapp, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [userId, data.store_name, data.description || null, data.whatsapp]
    );

    // Update user role to seller
    await pool.query(
      `UPDATE users SET role = 'seller', updated_at = NOW() WHERE id = ?`,
      [userId]
    );

    // Fetch updated user to generate new token
    const [users] = await pool.query<UserRow[]>(
      `SELECT id, nim, name, email, role FROM users WHERE id = ?`,
      [userId]
    );

    const user = users[0];

    const token = generateToken({
      id: user.id,
      nim: user.nim,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    return {
      id: result.insertId,
      store_name: data.store_name,
      description: data.description || null,
      whatsapp: data.whatsapp,
      message: "Toko berhasil dibuat",
      token,
    };
  }

  // Update store
  async updateStore(
    userId: number,
    data: {
      store_name?: string;
      description?: string;
      whatsapp?: string;
      pickup_locations?: string[];
      available_days?: string[];
      is_active?: boolean;
    }
  ) {
    const [stores] = await pool.query<StoreRow[]>(
      `SELECT id FROM stores WHERE user_id = ?`,
      [userId]
    );

    if (stores.length === 0) {
      throw new AppError("Toko tidak ditemukan", 404);
    }

    const updateFields: string[] = [];
    const values: any[] = [];

    if (data.store_name) {
      updateFields.push("store_name = ?");
      values.push(data.store_name);
    }
    if (data.description !== undefined) {
      updateFields.push("description = ?");
      values.push(data.description);
    }
    if (data.whatsapp) {
      updateFields.push("whatsapp = ?");
      values.push(data.whatsapp);
    }
    if (data.pickup_locations) {
      updateFields.push("pickup_locations = ?");
      values.push(JSON.stringify(data.pickup_locations));
    }
    if (data.available_days) {
      updateFields.push("available_days = ?");
      values.push(JSON.stringify(data.available_days));
    }
    if (data.is_active !== undefined) {
      updateFields.push("is_active = ?");
      values.push(data.is_active);
    }

    if (updateFields.length === 0) {
      throw new AppError("Tidak ada data yang diperbarui", 400);
    }

    updateFields.push("updated_at = NOW()");
    values.push(stores[0].id);

    await pool.query(
      `UPDATE stores SET ${updateFields.join(", ")} WHERE id = ?`,
      values
    );

    return this.getMyStore(userId);
  }

  // Get store by ID (public)
  async getStoreById(storeId: number) {
    const [stores] = await pool.query<StoreRow[]>(
      `SELECT s.*, u.name as owner_name, u.faculty, u.batch_year
       FROM stores s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = ? AND s.is_active = TRUE`,
      [storeId]
    );

    if (stores.length === 0) {
      throw new AppError("Toko tidak ditemukan", 404);
    }

    const store = stores[0];
    return {
      id: store.id,
      store_name: store.store_name,
      description: store.description,
      whatsapp: store.whatsapp,
      pickup_locations: store.pickup_locations
        ? JSON.parse(store.pickup_locations)
        : [],
      available_days: store.available_days
        ? JSON.parse(store.available_days)
        : [],
      is_active: store.is_active,
      created_at: store.created_at,
    };
  }
}
