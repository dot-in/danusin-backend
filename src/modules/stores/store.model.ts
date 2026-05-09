export interface CreateStoreDTO {
  store_name: string;
  description?: string;
  whatsapp: string;
}

export interface UpdateStoreDTO {
  store_name?: string;
  description?: string;
  whatsapp?: string;
  pickup_locations?: string[];
  available_days?: string[];
  is_active?: boolean;
}

export interface StoreDetailResponse {
  id: number;
  user_id: number;
  store_name: string;
  description: string | null;
  whatsapp: string;
  pickup_locations: string[];
  available_days: string[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  owner_name?: string;
  faculty?: string;
  batch_year?: number;
}
