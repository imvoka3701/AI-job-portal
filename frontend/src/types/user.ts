/** User roles matching backend enum */
export type UserRole = "candidate" | "employer" | "admin";

/** User profile */
export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  company_name: string | null;
  company_logo_url: string | null;
  company_description?: string | null;
  created_at: string;
}

/** User registration payload */
export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  company_name?: string;
}

/** User profile update payload */
export interface UserUpdatePayload {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  company_name?: string;
  company_logo_url?: string;
  company_description?: string;
}
