export interface User {
  id: number;
  nim: string;
  name: string | null;
  major: string | null;
  faculty: string | null;
  batch_year: number | null;
  whatsapp: string | null;
  email: string | null;
  password?: string;
  role: "buyer" | "seller";
  created_at?: Date;
  updated_at?: Date;
}

export interface Product {
  id: number;
  seller_id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  po_open_date: string;
  po_close_date: string;
  delivery_date: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Order {
  id: number;
  buyer_id: number;
  product_id: number;
  quantity: number;
  total_price: number;
  status: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at?: Date;
}
