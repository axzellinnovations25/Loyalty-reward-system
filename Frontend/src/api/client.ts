const BASE_URL = import.meta.env.VITE_API_URL as string;

function getToken(key = 'token'): string | null {
  return localStorage.getItem(key);
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  tokenKey = 'token',
): Promise<T> {
  const token = getToken(tokenKey);
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string>),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(body.message || 'Request failed');
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

function buildQuery(params: Record<string, unknown>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

// Shop-staff API client (token stored under 'token')
export const api = {
  get: <T>(path: string, params?: Record<string, unknown>) =>
    request<T>(`${path}${params ? buildQuery(params) : ''}`, {}),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

// Admin API client (token stored under 'admin_token')
export const adminApi = {
  get: <T>(path: string, params?: Record<string, unknown>) =>
    request<T>(`${path}${params ? buildQuery(params) : ''}`, {}, 'admin_token'),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }, 'admin_token'),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }, 'admin_token'),
  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE' }, 'admin_token'),
};
