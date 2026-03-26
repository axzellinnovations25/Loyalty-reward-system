import { api } from './client';
import type { MessageLog, PaginatedResponse, PaginationParams } from '../types';

interface ListMessagesParams extends PaginationParams {
  customerId?: string;
  messageType?: string;
}

export const messagesApi = {
  list: (params?: ListMessagesParams) =>
    api.get<PaginatedResponse<MessageLog>>('/messages', params as Record<string, unknown>),
};
