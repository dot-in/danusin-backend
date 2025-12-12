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
  created_at: string;
  updated_at: string;
}

export interface Image {
  id: number;
  url: string;
  alt_text: string | null;
  entity_type: "product" | "user";
  entity_id: number;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export interface Product {
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
  status: "Menunggu Konfirmasi" | "Diproses" | "Selesai" | "Dibatalkan";
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
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
