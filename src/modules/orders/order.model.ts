import { OrderStatus } from "@prisma/client";

export interface CreateOrderDTO {
  product_id: number;
  quantity: number;
  payment_method: "COD" | "DIGITAL";
}

export interface UpdateOrderStatusDTO {
  status: OrderStatus;
}

export interface OrderDetailResponse {
  id: number;
  buyer_id: number;
  product_id: number;
  seller_id: number;
  quantity: number;
  total_price: number;
  status: OrderStatus;
  created_at: Date;
  updated_at: Date;
  product_name: string;
  product_image: string | null;
  buyer_name?: string;
  buyer_whatsapp?: string;
  buyer_faculty?: string;
  seller_name?: string;
  seller_whatsapp?: string;
  seller_faculty?: string;
}
