import type { PropsWithChildren } from 'react';
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/auth';
import type { AuthUser } from '../types';
import { onUnauthorized } from '../lib/authEvents';
import { clearAuthToken, clearAuthUser, getAuthToken, getAuthUserRaw, setAuthToken, setAuthUserRaw } from '../lib/storage';

type AuthState = {
  isReady: boolean;
  token: string | null;
  user: AuthUser | null;
  setAuth: (user: AuthUser, token: string) => Promise<void>;
  clearAuth: () => Promise<void>;
};

export const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [isReady, setIsReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let isMounted = true;
    const offUnauthorized = onUnauthorized(() => {
      if (!isMounted) return;
      setToken(null);
      setUser(null);
    });
    (async () => {
      try {
        const saved = await getAuthToken();
        if (isMounted) setToken(saved);

        const rawUser = await getAuthUserRaw();
        if (rawUser && isMounted) {
          try {
            setUser(JSON.parse(rawUser) as AuthUser);
          } catch {
            await clearAuthUser();
          }
        }

        // If token exists, refresh user from backend
        if (saved) {
          try {
            const res = await authApi.me();
            const payload = (res as any).data ?? res;
            if (isMounted) {
              setUser(payload as AuthUser);
              await setAuthUserRaw(JSON.stringify(payload));
            }
          } catch {
            await clearAuthToken();
            await clearAuthUser();
            if (isMounted) {
              setToken(null);
              setUser(null);
            }
          }
        }
      } finally {
        if (isMounted) setIsReady(true);
      }
    })();
    return () => {
      isMounted = false;
      offUnauthorized();
    };
  }, []);

  const setAuth = useCallback(async (nextUser: AuthUser, nextToken: string) => {
    await setAuthToken(nextToken);
    await setAuthUserRaw(JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const clearAuth = useCallback(async () => {
    await clearAuthToken();
    await clearAuthUser();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ isReady, token, user, setAuth, clearAuth }),
    [isReady, token, user, setAuth, clearAuth],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
