import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { AuthUser, AdminAuthUser } from '../types';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
}

interface AdminAuthState {
  admin: AdminAuthUser | null;
  token: string | null;
}

interface AuthContextValue {
  // Shop staff auth
  auth: AuthState;
  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
  // Admin auth
  adminAuth: AdminAuthState;
  setAdminAuth: (admin: AdminAuthUser, token: string) => void;
  clearAdminAuth: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuthState] = useState<AuthState>(() => {
    const token = localStorage.getItem('token');
    const raw = localStorage.getItem('user');
    const user = raw ? (JSON.parse(raw) as AuthUser) : null;
    return { user, token };
  });

  const [adminAuth, setAdminAuthState] = useState<AdminAuthState>(() => {
    const token = localStorage.getItem('admin_token');
    const raw = localStorage.getItem('admin_user');
    const admin = raw ? (JSON.parse(raw) as AdminAuthUser) : null;
    return { admin, token };
  });

  const setAuth = useCallback((user: AuthUser, token: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setAuthState({ user, token });
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthState({ user: null, token: null });
  }, []);

  const setAdminAuth = useCallback((admin: AdminAuthUser, token: string) => {
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_user', JSON.stringify(admin));
    setAdminAuthState({ admin, token });
  }, []);

  const clearAdminAuth = useCallback(() => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setAdminAuthState({ admin: null, token: null });
  }, []);

  return (
    <AuthContext.Provider
      value={{ auth, setAuth, clearAuth, adminAuth, setAdminAuth, clearAdminAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used inside AuthProvider');
  return ctx;
}
