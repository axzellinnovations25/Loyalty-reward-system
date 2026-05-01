export type Customer = {
  id: string;
  shopId?: string;
  name: string;
  phone: string;
  totalPoints: number;
  lastActivityAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateCustomerRequest = {
  name: string;
  phone: string;
};

export type UpdateCustomerRequest = Partial<CreateCustomerRequest>;
