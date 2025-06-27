export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  userType: 'SHIP_COMPANY_ADMIN' | 'SHIP_ADMIN' | 'CAPTAIN' | 'SECOND_OFFICER';
  isActive: boolean;
  softDelete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type userTypeOption =
  | 'Admin'
  | 'SHIP_COMPANY_ADMIN'
  | 'SHIP_ADMIN'
  | 'CAPTAIN'
  | 'SECOND_OFFICER';

export type RegisterBody = Pick<User, 'name' | 'email' | 'password' | 'phone' | 'userType'>;
export type LoginBody = Pick<User, 'email' | 'password'>;
export type UpdateBody = Pick<User, 'name' | 'phone' | 'email'>;

export type ForgotPasswordBody = Pick<User, 'email'>;
export type ResetPasswordBody = Pick<User, 'email' | 'password'>;
export type ChangePasswordBody = Pick<User, 'password'>;

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
  userType: 'SHIP_COMPANY_ADMIN' | 'SHIP_ADMIN' | 'CAPTAIN' | 'SECOND_OFFICER';
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  userType?: 'SHIP_COMPANY_ADMIN' | 'SHIP_ADMIN' | 'CAPTAIN' | 'SECOND_OFFICER';
  isActive?: boolean;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  phone: string;
  userType: 'SHIP_COMPANY_ADMIN' | 'SHIP_ADMIN' | 'CAPTAIN' | 'SECOND_OFFICER';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserListResponse {
  users: UserResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: UserResponse;
  token: string;
}
