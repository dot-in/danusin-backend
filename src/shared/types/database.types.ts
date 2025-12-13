import type { RowDataPacket } from "mysql2";

export interface UserRow extends RowDataPacket {
  id: number;
  nim: string;
  name: string;
  major: string;
  faculty: string;
  batch_year: number;
  whatsapp: string;
  email: string;
  password: string;
  role: "buyer" | "seller";
  created_at: string;
  updated_at: string;
}

export interface ImageRow extends RowDataPacket {
  id: number;
  url: string;
  alt_text: string | null;
  entity_type: "product" | "user";
  entity_id: number;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export interface ProductRow extends RowDataPacket {
  id: number;
  seller_id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  po_open_date: string;
  po_close_date: string;
  delivery_date: string | null;
  created_at: string;
  updated_at: string;
  seller_name?: string;
  seller_faculty?: string;
  seller_whatsapp?: string;
}

export interface OrderRow extends RowDataPacket {
  id: number;
  buyer_id: number;
  product_id: number;
  quantity: number;
  total_price: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationRow extends RowDataPacket {
  id: number;
  user_id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface StoreRow extends RowDataPacket {
  id: number;
  user_id: number;
  store_name: string;
  whatsapp: string;
  email: string;
  student_proof_url: string;
  store_image: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export interface UserOrderRow extends RowDataPacket {
  id: number;
  status: string;
  total_amount: number;
  created_at: string;
  items: string | unknown[];
}
