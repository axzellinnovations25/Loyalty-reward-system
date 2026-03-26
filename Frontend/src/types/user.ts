export interface User {
  id: string;
  shopId: string;
  name: string;
  email: string;
  username: string | null;
  isActive: boolean;
  forcePasswordChange: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  username?: string;
  password: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  isActive?: boolean;
}

export interface ResetUserPasswordRequest {
  newPassword: string;
}
