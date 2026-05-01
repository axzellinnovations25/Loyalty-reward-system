export type LoginRequest = {
  username: string;
  password: string;
};

export type AuthUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  shopId: string;
  forcePasswordChange?: boolean;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

export type ChangePasswordRequest = {
  oldPassword: string;
  newPassword: string;
};
