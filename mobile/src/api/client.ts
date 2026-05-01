import { env } from '../config/env';
import { clearAuthToken, clearAuthUser, getAuthToken } from '../lib/storage';
import { emitUnauthorized } from '../lib/authEvents';

type Json = Record<string, unknown>;

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!env.apiBaseUrl) {
    throw new Error('Missing EXPO_PUBLIC_API_BASE_URL. Add it to mobile/.env (see .env.example).');
  }

  const token = await getAuthToken();
  const res = await fetch(`${env.apiBaseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : null),
      ...(options.headers as Json),
    } as HeadersInit,
  });

  if (!res.ok) {
    // Best effort parse
    const body = (await res.json().catch(() => null)) as { error?: string; message?: string } | null;

    if (res.status === 401) {
      await clearAuthToken();
      await clearAuthUser();
      emitUnauthorized();
    }

    throw new ApiError(body?.error || body?.message || res.statusText || 'Request failed', res.status);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

function buildQuery(params: Record<string, unknown>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const api = {
  get: <T>(path: string, params?: Record<string, unknown>) =>
    request<T>(`${path}${params ? buildQuery(params) : ''}`, {}),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
