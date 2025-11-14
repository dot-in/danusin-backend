import pool from "../config/db.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import jwt, { type SignOptions, type Secret } from "jsonwebtoken";
import type { User } from "../types/entities.js";
import { AppError } from "../utils/errors.js";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

interface RegisterInput {
  nim: string;
  name?: string;
  major?: string;
  faculty?: string;
  batch_year?: number;
  whatsapp?: string;
  email?: string;
  password: string;
  role: "buyer" | "seller";
}

interface LoginInput {
  credential: string;
  password: string;
}

const JWT_SECRET: Secret = (process.env.JWT_SECRET ?? "secret") as Secret;
const JWT_EXPIRES_IN: SignOptions["expiresIn"] = (process.env.JWT_EXPIRES ??
  "7d") as SignOptions["expiresIn"];

function mapUser(row: any): User {
  return {
    id: row.id,
    nim: row.nim,
    name: row.name,
    major: row.major,
    faculty: row.faculty,
    batch_year: row.batch_year,
    whatsapp: row.whatsapp,
    email: row.email,
    role: row.role,
  };
}

export async function register(data: RegisterInput): Promise<User> {
  const {
    nim,
    name,
    major,
    faculty,
    batch_year,
    whatsapp,
    email,
    password,
    role,
  } = data;

  if (!nim) throw new AppError("NIM wajib diisi");
  if (!password) throw new AppError("Password wajib diisi");
  if (!["buyer", "seller"].includes(role))
    throw new AppError("Role tidak valid (buyer/seller)");
  if (role === "seller" && !whatsapp)
    throw new AppError("Whatsapp wajib diisi untuk seller");

  const [existingNim] = await pool.execute<RowDataPacket[]>(
    "SELECT id FROM users WHERE nim = ?",
    [nim]
  );
  if (existingNim.length) throw new AppError("NIM sudah terdaftar");

  if (email) {
    const [existingEmail] = await pool.execute<RowDataPacket[]>(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );
    if (existingEmail.length) throw new AppError("Email sudah terdaftar");
  }

  const hashed = await hashPassword(password);

  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO users (nim, name, major, faculty, batch_year, whatsapp, email, password, role)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      nim,
      name ?? null,
      major ?? null,
      faculty ?? null,
      batch_year ?? null,
      whatsapp ?? null,
      email ?? null,
      hashed,
      role,
    ]
  );

  return {
    id: result.insertId,
    nim,
    name: name ?? null,
    major: major ?? null,
    faculty: faculty ?? null,
    batch_year: batch_year ?? null,
    whatsapp: whatsapp ?? null,
    email: email ?? null,
    role,
  };
}

export async function login({ credential, password }: LoginInput) {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT * FROM users WHERE nim = ? OR email = ? LIMIT 1",
    [credential, credential]
  );
  if (!rows.length)
    throw new AppError("User tidak ditemukan dengan NIM / email tersebut");
  const user = rows[0];
  const match = await comparePassword(password, user.password);
  if (!match) throw new AppError("Password salah");

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  return { token, user: mapUser(user) };
}

export async function getProfile(userId: number): Promise<User> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT * FROM users WHERE id = ?",
    [userId]
  );
  if (!rows.length) throw new AppError("User tidak ditemukan", 404);
  return mapUser(rows[0]);
}

interface UpdateProfileInput {
  name?: string;
  major?: string;
  faculty?: string;
  batch_year?: number;
  whatsapp?: string;
  email?: string;
  password?: string;
}

export async function updateProfile(userId: number, data: UpdateProfileInput) {
  const allowed = [
    "name",
    "major",
    "faculty",
    "batch_year",
    "whatsapp",
    "email",
    "password",
  ] as const;
  const sets: string[] = [];
  const values: any[] = [];

  for (const key of allowed) {
    const v = (data as any)[key];
    if (v !== undefined && v !== null) {
      if (key === "password") {
        const hashed = await hashPassword(v);
        sets.push("password=?");
        values.push(hashed);
      } else {
        sets.push(`${key}=?`);
        values.push(v);
      }
    }
  }
  if (!sets.length) return { message: "Tidak ada perubahan" };
  values.push(userId);

  await pool.execute<ResultSetHeader>(
    `UPDATE users SET ${sets.join(", ")} WHERE id=?`,
    values
  );
  return { message: "Profil diperbarui" };
}

export async function upgradeToSeller(userId: number, whatsapp?: string) {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT id, role, whatsapp FROM users WHERE id = ?",
    [userId]
  );
  if (!rows.length) throw new AppError("User tidak ditemukan", 404);
  const user = rows[0];

  if (user.role === "seller") throw new AppError("User sudah menjadi seller");
  if (!user.whatsapp && !whatsapp)
    throw new AppError("Harap cantumkan whatsapp untuk upgrade ke seller");

  if (whatsapp) {
    await pool.execute<ResultSetHeader>(
      "UPDATE users SET whatsapp = ?, role = ? WHERE id = ?",
      [whatsapp, "seller", userId]
    );
  } else {
    await pool.execute<ResultSetHeader>(
      "UPDATE users SET role = ? WHERE id = ?",
      ["seller", userId]
    );
  }

  return getProfile(userId);
}
