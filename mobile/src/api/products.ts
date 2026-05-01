import { api } from './client';
import type { ApiResponse, Product, PaginatedResponse, PaginationParams, ProductCategory } from '../types';

type ListProductsParams = PaginationParams & {
  search?: string;
  categoryId?: string;
};

export const productsApi = {
  list: (params?: ListProductsParams) =>
    api.get<ApiResponse<PaginatedResponse<Product>> | { success: boolean; data: PaginatedResponse<Product> }>('/products', params as Record<string, unknown>),
  
  listCategories: () =>
    api.get<ApiResponse<ProductCategory[]> | { success: boolean; data: ProductCategory[] }>('/products/categories'),
  
  get: (id: string) => api.get<ApiResponse<Product>>(`/products/${id}`),
};
