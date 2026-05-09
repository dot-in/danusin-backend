export interface SellerSummaryResponse {
  total_revenue: number;
  monthly_revenue: number;
  pending_orders_count: number;
  completed_orders_count: number;
  total_products_count: number;
  total_orders_count: number;
  monthly_sales: Array<{ month: string; revenue: number }>;
  recent_orders: Array<{
    id: number;
    quantity: number;
    total_price: number;
    status: string;
    created_at: Date;
    product_name: string;
    buyer_name: string;
  }>;
}

export interface BuyerSummaryResponse {
  total_orders_count: number;
  total_spent: number;
  orders_by_status: Array<{ status: string; count: number }>;
  recent_orders: Array<{
    id: number;
    quantity: number;
    total_price: number;
    status: string;
    created_at: Date;
    product_name: string;
    product_image: string | null;
    seller_name: string;
  }>;
}
