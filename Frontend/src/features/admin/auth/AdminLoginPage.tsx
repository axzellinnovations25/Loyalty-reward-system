import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../../hooks/useAuth';
import { adminAuthApi } from '../../../api/admin/auth';
import './admin-login.css';

export default function AdminLoginPage() {
  const { setAdminAuth } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // API client returns the full envelope: { success, data: { token, admin } }
      const envelope = await adminAuthApi.login({ email, password }) as unknown as {
        data: { token: string; admin: { id: string; name: string; email: string } };
      };
      const { token, admin } = envelope.data;
      setAdminAuth(admin, token);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="al-root">
      <div className="al-orb al-orb--1" />
      <div className="al-orb al-orb--2" />
      <div className="al-orb al-orb--3" />

      <div className="al-card">
        {/* Brand */}
        <div className="al-brand">
          <div className="al-logo">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
              <path d="M11 2L20 7v8L11 20 2 15V7L11 2z" fill="url(#mGrad)" />
              <path d="M7 11l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="mGrad" x1="2" y1="2" x2="20" y2="20" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#e03050" />
                  <stop offset="1" stopColor="#8b0020" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="al-brand-name">LoyaltyOS</span>
        </div>

        {/* Header */}
        <div className="al-header">
          <h1 className="al-title">Admin Portal</h1>
          <p className="al-subtitle">Restricted access — administrators only</p>
        </div>

        {/* Form */}
        <form className="al-form" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="al-error" role="alert">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                <circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" strokeWidth="1.4" />
                <path d="M7.5 4.5v3.5M7.5 10v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              {error}
            </div>
          )}

          <div className="al-field">
            <label className="al-label" htmlFor="admin-email">Email address</label>
            <div className="al-input-wrap">
              <svg className="al-input-icon" width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                <rect x="1" y="3" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                <path d="M1 4.5l6.5 4.5L14 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <input
                id="admin-email"
                className="al-input"
                type="email"
                autoComplete="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="al-field">
            <label className="al-label" htmlFor="admin-password">Password</label>
            <div className="al-input-wrap">
              <svg className="al-input-icon" width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                <rect x="2.5" y="6.5" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                <path d="M5 6.5V4.5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                <circle cx="7.5" cy="10" r="1" fill="currentColor" />
              </svg>
              <input
                id="admin-password"
                className="al-input al-input--pw"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="button"
                className="al-eye"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M1 8C2.5 5 5 3.5 8 3.5s5.5 1.5 7 4.5c-1.5 3-4 4.5-7 4.5S2.5 11 1 8z" stroke="currentColor" strokeWidth="1.3"/>
                    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/>
                    <line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M1 8C2.5 5 5 3.5 8 3.5s5.5 1.5 7 4.5c-1.5 3-4 4.5-7 4.5S2.5 11 1 8z" stroke="currentColor" strokeWidth="1.3"/>
                    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            id="admin-login-btn"
            className="al-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="al-spinner" aria-hidden="true" />
                Signing in…
              </>
            ) : (
              'Sign in to Admin Portal'
            )}
          </button>
        </form>

        <div className="al-divider">
          <div className="al-divider-line" />
          <span className="al-divider-text">SECURE LOGIN</span>
          <div className="al-divider-line" />
        </div>

        <p className="al-footer-note">
          Protected by encrypted session tokens · LoyaltyOS v1.0
        </p>
      </div>
    </div>
  );
}
