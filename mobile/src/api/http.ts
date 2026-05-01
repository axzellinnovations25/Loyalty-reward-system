import { env } from '../config/env';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  token?: string | null;
};

export async function http<TResponse>(path: string, options: RequestOptions = {}): Promise<TResponse> {
  if (!env.apiBaseUrl) {
    throw new Error('Missing EXPO_PUBLIC_API_BASE_URL. Add it to mobile/shop-app/.env (see .env.example).');
  }

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : null),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status} ${response.statusText}${text ? `: ${text}` : ''}`);
  }

  if (response.status === 204) return undefined as TResponse;
  return (await response.json()) as TResponse;
}

