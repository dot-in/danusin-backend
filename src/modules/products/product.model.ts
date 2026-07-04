export interface CreateProductDTO {
  name: string;
  description: string;
  price: number;
  stock?: number;
  po_open_date: string | Date;
  po_close_date: string | Date;
  delivery_date?: string | Date;
  images?: string[];
  pickup_locations?: string[];
  available_days?: string[];
}

export interface UpdateProductDTO {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  po_open_date?: string | Date;
  po_close_date?: string | Date;
  delivery_date?: string | Date | null;
  images?: string[];
  add_images?: string[];
  remove_image_ids?: number[];
  pickup_locations?: string[];
  available_days?: string[];
}

export interface GetProductsQuery {
  q?: string;
  min_price?: number;
  max_price?: number;
  open_only?: boolean;
  seller_id?: number;
  exclude_seller_id?: number;
  page?: number;
  limit?: number;
  days?: string[];
  locations?: string[];
}

export interface PaginatedProductsResponse {
  products: any[];
  total: number;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
