import { pool } from "../../core/config/database.config.js";
import { AppError } from "../../core/middlewares/error.middleware.js";
import { UserRow } from "../../shared/types/database.types.js";
import { ERROR_MESSAGES } from "../../shared/constants/message.constant.js";

export class UserService {
  async getPublicProfile(userId: number) {
    const [users] = await pool.query<UserRow[]>(
      `SELECT 
        u.id, 
        u.name, 
        u.faculty, 
        u.batch_year,
        COUNT(p.id) as active_products_count
       FROM users u
       LEFT JOIN products p ON u.id = p.seller_id AND p.po_close_date >= CURDATE()
       WHERE u.id = ? AND u.role = 'seller'
       GROUP BY u.id`,
      [userId]
    );

    if (users.length === 0) {
      throw new AppError(ERROR_MESSAGES.USER.NOT_FOUND, 404);
    }

    return users[0];
  }
}
