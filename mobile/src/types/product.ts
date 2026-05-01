export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  categoryId: string | null;
  unit: string | null;
  imageUrl: string | null;
  price: number;
  cost: number | null;
  taxRate: number | null;
  trackInventory: boolean;
  stockOnHand: number;
  reorderLevel: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
