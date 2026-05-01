export interface ProductCategory {
  id: string;
  shopId: string;
  name: string;
  description?: string | null;
  createdAt: string;
}

export interface Product {
  id: string;
  shopId: string;
  categoryId?: string | null;
  name: string;
  sku: string;
  barcode?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  unit?: string | null;
  price: string | number;
  cost?: string | number | null;
  taxRate?: string | number | null;
  trackInventory: boolean;
  stockOnHand: number;
  reorderLevel: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  category?: ProductCategory | null;
}

export interface CreateProductCategoryRequest {
  name: string;
  description?: string;
}

export interface UpdateProductCategoryRequest {
  name?: string;
  description?: string;
}

export interface CreateProductRequest {
  categoryId?: string | null;
  name: string;
  sku: string;
  barcode?: string | null;
  description?: string;
  imageUrl?: string;
  unit?: string;
  price: number;
  cost?: number | null;
  taxRate?: number | null;
  trackInventory?: boolean;
  stockOnHand?: number;
  reorderLevel?: number;
  isActive?: boolean;
}

export type UpdateProductRequest = Partial<CreateProductRequest>;

