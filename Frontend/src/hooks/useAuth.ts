import { useAuthContext } from '../context/AuthContext';

/** Convenience hook for shop-staff auth. */
export function useAuth() {
  const { auth, setAuth, clearAuth } = useAuthContext();
  return {
    user: auth.user,
    token: auth.token,
    isAuthenticated: auth.token !== null,
    setAuth,
    clearAuth,
  };
}

/** Convenience hook for admin auth. */
export function useAdminAuth() {
  const { adminAuth, setAdminAuth, clearAdminAuth } = useAuthContext();
  return {
    admin: adminAuth.admin,
    token: adminAuth.token,
    isAuthenticated: adminAuth.token !== null,
    setAdminAuth,
    clearAdminAuth,
  };
}
