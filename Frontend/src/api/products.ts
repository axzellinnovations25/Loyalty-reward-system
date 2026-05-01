import { api } from './client';
import type {
  Product,
  ProductCategory,
  CreateProductRequest,
  UpdateProductRequest,
  CreateProductCategoryRequest,
  UpdateProductCategoryRequest,
  PaginatedResponse,
  PaginationParams,
} from '../types';

interface ListProductsParams extends PaginationParams {
  search?: string;
  categoryId?: string;
  includeInactive?: boolean;
  lowStock?: boolean;
}

export const productsApi = {
  // Categories
  listCategories: () =>
    api.get<{ success: boolean; data: ProductCategory[] }>('/products/categories'),
  createCategory: (data: CreateProductCategoryRequest) =>
    api.post<{ success: boolean; data: ProductCategory }>('/products/categories', data),
  updateCategory: (id: string, data: UpdateProductCategoryRequest) =>
    api.patch<{ success: boolean; data: ProductCategory }>(`/products/categories/${id}`, data),
  deleteCategory: (id: string) =>
    api.delete<void>(`/products/categories/${id}`),

  // Products
  list: (params?: ListProductsParams) =>
    api.get<{ success: boolean; data: PaginatedResponse<Product> }>('/products', params as Record<string, unknown>),
  lookup: (params: { sku?: string; barcode?: string }) =>
    api.get<{ success: boolean; data: Product }>(
      '/products/lookup',
      params as Record<string, unknown>,
    ),
  get: (id: string) =>
    api.get<{ success: boolean; data: Product }>(`/products/${id}`),
  create: (data: CreateProductRequest) =>
    api.post<{ success: boolean; data: Product }>('/products', data),
  update: (id: string, data: UpdateProductRequest) =>
    api.patch<{ success: boolean; data: Product }>(`/products/${id}`, data),
  delete: (id: string) =>
    api.delete<void>(`/products/${id}`),
};

