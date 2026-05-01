import { api } from './client';
import type { MessageLog, PaginatedResponse, PaginationParams } from '../types';

type ListMessagesParams = PaginationParams & {
  customerId?: string;
  messageType?: string;
};

export const messagesApi = {
  list: (params?: ListMessagesParams) =>
    api.get<{ data?: PaginatedResponse<MessageLog> } | PaginatedResponse<MessageLog>>('/messages', params as Record<string, unknown>),
};
