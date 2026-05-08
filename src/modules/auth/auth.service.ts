import type { ResultSetHeader } from "mysql2";
import { pool } from "../../core/config/database.config.js";
import { AppError } from "../../core/middlewares/error.middleware.js";
import { hashPassword, comparePassword } from "../../shared/utils/bcrypt.util.js";
import { generateToken } from "../../shared/utils/jwt.util.js";
import type { UserRow } from "../../shared/types/database.types.js";
import type { UserWithoutPassword } from "../../shared/types/common.types.js";
import { ERROR_MESSAGES } from "../../shared/constants/message.constant.js";

interface RegisterDTO {
  nim: string;
  name: string;
  major: string;
  faculty: string;
  batch_year: number;
  whatsapp: string;
  email: string;
  password: string;
  role?: "buyer" | "seller";
}

interface UpdateProfileDTO {
  name?: string;
  major?: string;
  faculty?: string;
  batch_year?: number;
  whatsapp?: string;
}

export class AuthService {
  async register(userData: RegisterDTO): Promise<UserWithoutPassword> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [existing] = await connection.query<UserRow[]>(
        "SELECT nim, email FROM users WHERE nim = ? OR email = ?",
        [userData.nim, userData.email]
      );

      if (existing.length > 0) {
        if (existing.some((u) => u.nim === userData.nim)) throw new AppError(ERROR_MESSAGES.AUTH.NIM_EXISTS, 400);
        if (existing.some((u) => u.email === userData.email)) throw new AppError(ERROR_MESSAGES.AUTH.EMAIL_EXISTS, 400);
      }

      const hashedPassword = await hashPassword(userData.password);
      const [result] = await connection.query<ResultSetHeader>(
        `INSERT INTO users (nim, name, major, faculty, batch_year, whatsapp, email, password, role)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userData.nim, userData.name, userData.major, userData.faculty, userData.batch_year, userData.whatsapp, userData.email, hashedPassword, userData.role || "buyer"]
      );

      const [users] = await connection.query<UserRow[]>(
        `SELECT id, nim, name, major, faculty, batch_year, whatsapp, email, role, created_at, updated_at
         FROM users WHERE id = ?`,
        [result.insertId]
      );

      await connection.commit();
      return users[0] as UserWithoutPassword;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async login(credential: string, password: string): Promise<{ token: string; user: UserWithoutPassword }> {
    const [users] = await pool.query<UserRow[]>("SELECT * FROM users WHERE nim = ? OR email = ?", [credential, credential]);
    if (users.length === 0) throw new AppError(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS, 401);

    const user = users[0];
    if (!(await comparePassword(password, user.password))) throw new AppError(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS, 401);

    const token = generateToken({ id: user.id, nim: user.nim, name: user.name, email: user.email, role: user.role });
    const { password: _, ...userWithoutPassword } = user;
    return { token, user: userWithoutPassword };
  }

  async getProfile(userId: number): Promise<UserWithoutPassword> {
    const [users] = await pool.query<UserRow[]>(
      `SELECT id, nim, name, major, faculty, batch_year, whatsapp, email, role, created_at, updated_at
       FROM users WHERE id = ?`,
      [userId]
    );
    if (users.length === 0) throw new AppError(ERROR_MESSAGES.USER.NOT_FOUND, 404);
    return users[0] as UserWithoutPassword;
  }

  async updateProfile(userId: number, updateData: UpdateProfileDTO): Promise<UserWithoutPassword> {
    const fields: string[] = [];
    const values: (string | number)[] = [];

    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) throw new AppError("Tidak ada data yang diupdate", 400);
    values.push(userId);

    const [result] = await pool.query<ResultSetHeader>(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, values);
    if (result.affectedRows === 0) throw new AppError(ERROR_MESSAGES.USER.NOT_FOUND, 404);

    return this.getProfile(userId);
  }

  async upgradeSeller(userId: number, whatsapp?: string): Promise<UserWithoutPassword> {
    const [users] = await pool.query<UserRow[]>("SELECT role FROM users WHERE id = ?", [userId]);
    if (users.length === 0) throw new AppError(ERROR_MESSAGES.USER.NOT_FOUND, 404);
    if (users[0].role === "seller") throw new AppError(ERROR_MESSAGES.AUTH.ALREADY_SELLER, 403);

    const fields = whatsapp ? "role = ?, whatsapp = ?" : "role = ?";
    const values = whatsapp ? ["seller", whatsapp, userId] : ["seller", userId];

    await pool.query(`UPDATE users SET ${fields} WHERE id = ?`, values);
    return this.getProfile(userId);
  }
}
