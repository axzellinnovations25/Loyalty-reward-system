import type { Purchase } from './purchase';
import type { Redemption } from './redemption';

export interface Customer {
  id: string;
  shopId: string;
  name: string;
  phone: string;
  totalPoints: number;
  lastActivityAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  purchases?: Purchase[];
  redemptions?: Redemption[];
}

export interface CreateCustomerRequest {
  name: string;
  phone: string; // Sri Lankan format: +94 7X XXX XXXX
}

export interface UpdateCustomerRequest {
  name?: string;
  phone?: string;
}
