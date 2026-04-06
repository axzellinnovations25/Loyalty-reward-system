export interface LoginRequest {
  username: string;
  password: string;
}

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  shopId: string;
  role: string;
  forcePasswordChange: boolean;
}

export interface AdminLoginResponse {
  token: string;
  admin: AdminAuthUser;
}

export interface AdminAuthUser {
  id: string;
  name: string;
  email: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}
