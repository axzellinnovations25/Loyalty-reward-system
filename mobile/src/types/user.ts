export type User = {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  isActive?: boolean;
  createdAt: string;
};

export type CreateUserRequest = {
  name: string;
  username: string;
  email: string;
  role: string;
  password: string;
};

export type UpdateUserRequest = Partial<Omit<CreateUserRequest, 'password'>> & {
  isActive?: boolean;
};

export type ResetUserPasswordRequest = {
  userId: string;
  newPassword: string;
};

