import { Role } from "@prisma/client";
import { UserWithoutPassword } from "../../shared/types/common.types.js";

export interface RegisterDTO {
  nim: string;
  name: string;
  major: string;
  faculty: string;
  batch_year: number;
  whatsapp: string;
  email: string;
  password: string;
  role?: Role;
}

export interface LoginDTO {
  credential: string; // nim or email
  password: string;
}

export interface UpdateProfileDTO {
  name?: string;
  major?: string;
  faculty?: string;
  batch_year?: number;
  whatsapp?: string;
}

export interface AuthResponse {
  token: string;
  user: UserWithoutPassword;
}
