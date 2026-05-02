export interface User {
  id: string;
  shopId: string;
  name: string;
  username: string;
  role?: 'owner' | 'staff';
  isActive: boolean;
  forcePasswordChange: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface CreateUserRequest {
  name: string;
  username: string;
  password: string;
}

export interface UpdateUserRequest {
  name?: string;
  username?: string;
  isActive?: boolean;
}

export interface ResetUserPasswordRequest {
  newPassword: string;
}
