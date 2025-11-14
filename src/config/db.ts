import { createPool, type Pool } from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

if (!DB_HOST || !DB_USER || !DB_NAME) {
  throw new Error("Missing DB environment variables");
}

const pool: Pool = createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  connectionLimit: 10,
});

export default pool;
