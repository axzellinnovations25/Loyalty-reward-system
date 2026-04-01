export interface LoginRequest {
  username: string;
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
  currentPassword: string;
  newPassword: string;
}
