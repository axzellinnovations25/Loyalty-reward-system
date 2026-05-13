import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../api/auth';
import './login.css';

export default function ForceChangePasswordPage() {
  const { user, token, setAuth, clearAuth } = useAuth();
  const navigate = useNavigate();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await authApi.changePassword({ oldPassword: currentPassword, newPassword });
      
      if (user && token) {
        setAuth({ ...user, forcePasswordChange: false }, token);
      }
      
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error('Change password error:', err);
      const message = err.response?.data?.error || err.message || 'Failed to change password.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sl-root">
      <div className="sl-orb sl-orb--1" />
      <div className="sl-orb sl-orb--2" />

      <div className="sl-card">
        <div className="sl-brand">
          <div className="sl-logo">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
              <path d="M11 2L20 7v8L11 20 2 15V7L11 2z" fill="currentColor" />
              <path d="M7 11l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="sl-brand-name">LoyaltyOS</span>
        </div>

        <div className="sl-header">
          <h1 className="sl-title">Update Password</h1>
          <p className="sl-subtitle">For security, please change your password before continuing.</p>
        </div>

        <form className="sl-form" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="sl-error" role="alert">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                <circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" strokeWidth="1.4" />
                <path d="M7.5 4.5v3.5M7.5 10v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              {error}
            </div>
          )}

          <div className="sl-field">
            <label className="sl-label" htmlFor="currentPassword">Current Password</label>
            <div className="sl-input-wrap">
              <input
                id="currentPassword"
                className="sl-input"
                type={showCurrent ? 'text' : 'password'}
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="button"
                className="sl-eye"
                onClick={() => setShowCurrent(!showCurrent)}
                aria-label={showCurrent ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showCurrent ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M1 8C2.5 5 5 3.5 8 3.5s5.5 1.5 7 4.5c-1.5 3-4 4.5-7 4.5S2.5 11 1 8z" stroke="currentColor" strokeWidth="1.3"/>
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

          <div className="sl-field">
            <label className="sl-label" htmlFor="newPassword">New Password</label>
            <div className="sl-input-wrap">
              <input
                id="newPassword"
                className="sl-input"
                type={showNew ? 'text' : 'password'}
                placeholder="New password (min 6 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="button"
                className="sl-eye"
                onClick={() => setShowNew(!showNew)}
                aria-label={showNew ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showNew ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M1 8C2.5 5 5 3.5 8 3.5s5.5 1.5 7 4.5c-1.5 3-4 4.5-7 4.5S2.5 11 1 8z" stroke="currentColor" strokeWidth="1.3"/>
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

          <div className="sl-field">
            <label className="sl-label" htmlFor="confirmPassword">Confirm New Password</label>
            <div className="sl-input-wrap">
              <input
                id="confirmPassword"
                className="sl-input"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="button"
                className="sl-eye"
                onClick={() => setShowConfirm(!showConfirm)}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showConfirm ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M1 8C2.5 5 5 3.5 8 3.5s5.5 1.5 7 4.5c-1.5 3-4 4.5-7 4.5S2.5 11 1 8z" stroke="currentColor" strokeWidth="1.3"/>
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
            className="sl-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="sl-spinner" aria-hidden="true" />
                Updating…
              </>
            ) : (
              'Update Password'
            )}
          </button>
          
          <button type="button" className="sl-signout" onClick={() => clearAuth()}>
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
