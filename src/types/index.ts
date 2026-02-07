// Shared TypeScript interfaces for the application

// User and Authentication types
export type UserRole = 'student' | 'teacher' | 'director' | 'admin';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  avatar_url: string | null;
  phone: string | null;
  school_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role?: UserRole;
  phone?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

export interface ApiMessageResponse {
  message: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// Content types
export interface ChooseUsCard {
  id: number;
  text: string;
  title: string;
  image: string;
}

export interface Partner {
  id: number;
  image: string;
}

export interface BlogPost {
  id: number;
  image: string | null;
  title: string;
  letter: string;
  date: string;
  hot: boolean | null;
}

// Documentation page types
export interface DocumentationItem {
  id: number;
  title: string;
  description: string;
  iconName: string;
}

export interface BudgetSubItem {
  name: string;
  amount: number;
}

export interface BudgetDetail {
  name: string;
  amount: number;
  subItems?: BudgetSubItem[];
}

export interface BudgetCategory {
  id: number;
  category: string;
  amount: number;
  percentage: number;
  details: BudgetDetail[];
}
