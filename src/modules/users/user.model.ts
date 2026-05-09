export interface UpdateUserDTO {
  name?: string;
  whatsapp?: string;
  faculty?: string;
  batch_year?: number;
  major?: string;
}

export interface ChangePasswordDTO {
  current_password: string;
  new_password: string;
}

export interface UserPublicProfileResponse {
  id: number;
  name: string;
  faculty: string;
  batch_year: number;
  major: string;
  active_products_count: number;
  profile_image: string | null;
  store_name: string | null;
  store_description: string | null;
}

export interface UserPrivateProfileResponse {
  id: number;
  nim: string;
  name: string;
  email: string;
  whatsapp: string | null;
  major: string;
  faculty: string;
  batch_year: number;
  role: string;
  created_at: Date;
  profile_image: string | null;
}
