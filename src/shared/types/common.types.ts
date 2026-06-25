export interface User {
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
  created_at: Date;
  updated_at: Date;
}

export interface Image {
  id: number;
  url: string;
  alt_text: string | null;
  entity_type: "product" | "user" | "store";
  entity_id: number;
  is_primary: boolean;
  sort_order: number;
  created_at: Date;
}

export interface Product {
  id: number;
  seller_id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  po_open_date: Date;
  po_close_date: Date;
  delivery_date: Date | null;
  created_at: Date;
  updated_at: Date;
  images?: Image[];
  primary_image?: string | null;
  available_days?: string[];
  seller_name?: string;
  seller_faculty?: string;
  seller_whatsapp?: string;
}

export interface Order {
  id: number;
  buyer_id: number;
  product_id: number;
  quantity: number;
  total_price: number;
  status: "MENUNGGU_KONFIRMASI" | "DIPROSES" | "SELESAI" | "DIBATALKAN";
  created_at: Date;
  updated_at: Date;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: Date;
}

export interface AuthUser {
  id: number;
  nim: string;
  name: string;
  email: string;
  role: "buyer" | "seller";
}

export interface JWTPayload {
  id: number;
  nim: string;
  name: string;
  email: string;
  role: "buyer" | "seller";
}

export type UserWithoutPassword = Omit<User, "password">;

export type OrderStatus = Order["status"];
export type UserRole = User["role"];
