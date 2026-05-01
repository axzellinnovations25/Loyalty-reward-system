import type { PropsWithChildren } from 'react';
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { clearAuthToken, getAuthToken, setAuthToken } from '../lib/storage';

type AuthState = {
  isReady: boolean;
  token: string | null;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [isReady, setIsReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const saved = await getAuthToken();
        if (isMounted) setToken(saved);
      } finally {
        if (isMounted) setIsReady(true);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const signIn = useCallback(async (nextToken: string) => {
    await setAuthToken(nextToken);
    setToken(nextToken);
  }, []);

  const signOut = useCallback(async () => {
    await clearAuthToken();
    setToken(null);
  }, []);

  const value = useMemo<AuthState>(() => ({ isReady, token, signIn, signOut }), [isReady, token, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

