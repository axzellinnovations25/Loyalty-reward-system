import { useState, useEffect, useCallback, useRef } from 'react';
import { adminShopsApi } from '../../../api/admin/shops';
import { adminUsersApi } from '../../../api/admin/users';
import type { Shop, PlanId, User } from '../../../types';

// ── Constants ─────────────────────────────────────────────────────────────────

const PLANS: { id: PlanId; label: string }[] = [
  { id: 'basic',      label: 'Basic' },
  { id: 'standard',   label: 'Standard' },
  { id: 'pro',        label: 'Pro' },
  { id: 'enterprise', label: 'Enterprise' },
];

const STATUS_BADGE: Record<string, string> = {
  active:   'adm-badge--green',
  trial:    'adm-badge--amber',
  inactive: 'adm-badge--gray',
};

const PLAN_BADGE: Record<string, string> = {
  pro:        'adm-badge--maroon',
  standard:   'adm-badge--blue',
  basic:      'adm-badge--gray',
  enterprise: 'adm-badge--green',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function shopStatus(shop: Shop): string {
  if (!shop.isActive) return 'inactive';
  if (shop.trialPlanId && shop.trialExpiresAt && new Date(shop.trialExpiresAt) > new Date()) return 'trial';
  return 'active';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Add Shop Modal ─────────────────────────────────────────────────────────────

interface AddShopModalProps {
  onClose: () => void;
  onCreated: (shop: Shop) => void;
}

function AddShopModal({ onClose, onCreated }: AddShopModalProps) {
  const [name,        setName]        = useState('');
  const [email,       setEmail]       = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [planId,      setPlanId]      = useState<PlanId>('basic');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const nameRef    = useRef<HTMLInputElement>(null);

  // Focus name input on mount
  useEffect(() => { nameRef.current?.focus(); }, []);

  // Click outside to close
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  // Escape key close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) { setError('Shop name and email are required.'); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await adminShopsApi.create({
        name: name.trim(),
        email: email.trim(),
        contactInfo: contactInfo.trim() || undefined,
        planId,
      });
      // The API returns { success, data }
      const shop = (res as unknown as { data: Shop }).data ?? (res as unknown as Shop);
      onCreated(shop);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create shop.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15,10,12,0.55)',
        backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
        animation: 'adm-fade-in 0.15s ease',
      }}
    >
      <div
        style={{
          background: 'var(--white)',
          borderRadius: 'var(--r-xl)',
          boxShadow: 'var(--shadow-lg)',
          width: '100%', maxWidth: 480,
          margin: '0 16px',
          overflow: 'hidden',
          animation: 'adm-slide-up 0.2s ease',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 'var(--r-md)',
              background: 'var(--a-100)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--a-600)',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M3 9.5L12 3l9 6.5V21a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.6"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.97rem', color: 'var(--text-primary)' }}>Add New Shop</div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: 1 }}>
                Creates the shop with default settings
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 6, borderRadius: 6, color: 'var(--text-secondary)',
              display: 'flex', transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--n-100)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <form id="add-shop-form" onSubmit={handleSubmit} style={{ padding: '22px 24px' }}>
          {error && (
            <div style={{
              background: 'var(--danger-bg)', border: '1px solid rgba(220,38,38,0.2)',
              borderRadius: 'var(--r-sm)', padding: '10px 14px',
              color: 'var(--danger)', fontSize: '0.83rem', fontWeight: 500,
              marginBottom: 18, display: 'flex', alignItems: 'flex-start', gap: 8,
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M7 4v3.5M7 9.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              {error}
            </div>
          )}

          {/* Shop Name */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              Shop Name <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              ref={nameRef}
              id="add-shop-name"
              type="text"
              className="adm-input"
              placeholder="e.g. Sunrise Fashion Store"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={100}
              required
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              Shop Email <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              id="add-shop-email"
              type="email"
              className="adm-input"
              placeholder="e.g. shop@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Contact Info (Phone) */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              Phone Number
              <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--text-secondary)', marginLeft: 6 }}>optional</span>
            </label>
            <input
              id="add-shop-contact"
              type="tel"
              className="adm-input"
              placeholder="e.g. +1 234 567 890"
              value={contactInfo}
              onChange={e => setContactInfo(e.target.value)}
              maxLength={200}
            />
          </div>

          {/* Plan */}
          <div style={{ marginBottom: 6 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
              Plan <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {PLANS.map(p => (
                <label
                  key={p.id}
                  htmlFor={`plan-${p.id}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px',
                    border: `1.5px solid ${planId === p.id ? 'var(--a-400)' : 'var(--border)'}`,
                    borderRadius: 'var(--r-sm)',
                    cursor: 'pointer',
                    background: planId === p.id ? 'var(--a-50)' : 'var(--white)',
                    transition: 'all 0.15s',
                  }}
                >
                  <input
                    id={`plan-${p.id}`}
                    type="radio"
                    name="planId"
                    value={p.id}
                    checked={planId === p.id}
                    onChange={() => setPlanId(p.id)}
                    style={{ accentColor: 'var(--a-600)', width: 14, height: 14 }}
                  />
                  <span style={{
                    fontSize: '0.83rem', fontWeight: 600,
                    color: planId === p.id ? 'var(--a-600)' : 'var(--text-primary)',
                    textTransform: 'capitalize',
                  }}>{p.label}</span>
                </label>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: 10,
          padding: '14px 24px 20px',
          borderTop: '1px solid var(--border)',
        }}>
          <button
            type="button"
            className="adm-btn adm-btn--ghost"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-shop-form"
            className="adm-btn adm-btn--primary"
            disabled={loading}
            id="add-shop-submit"
          >
            {loading ? (
              <>
                <span className="adm-spinner" style={{ width: 13, height: 13 }} />
                Creating…
              </>
            ) : (
              <>
                Create Shop
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Reset Password Modal ────────────────────────────────────────────────────────
interface ResetPasswordModalProps {
  user: User;
  onClose: () => void;
  onReset: (msg: string) => void;
}

function ResetPasswordModal({ user, onClose, onReset }: ResetPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await adminUsersApi.resetPassword(user.id, password);
      onReset(`Password reset for ${user.username}. They will be forced to change it on next login.`);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15,10,12,0.4)',
        backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1100,
        animation: 'adm-fade-in 0.1s ease',
      }}
    >
      <div
        style={{
          background: 'var(--white)', borderRadius: 'var(--r-lg)',
          boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: 400,
          margin: '0 16px', overflow: 'hidden',
          animation: 'adm-slide-up 0.15s ease',
        }}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>Reset Password</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
            Set a temporary password for <strong>{user.username}</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>
          {error && (
            <div style={{
              background: 'var(--danger-bg)', border: '1px solid rgba(220,38,38,0.1)',
              borderRadius: 'var(--r-sm)', padding: '10px 12px',
              color: 'var(--danger)', fontSize: '0.78rem', marginBottom: 16
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Temporary Password</label>
            <input
              type="password" className="adm-input" placeholder="Min 8 characters"
              value={password} onChange={e => setPassword(e.target.value)} minLength={8} required autoFocus
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="adm-btn adm-btn--ghost" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="adm-btn adm-btn--primary" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Manage Shop Modal ────────────────────────────────────────────────────────

interface ManageShopModalProps {
  shop: Shop;
  onClose: () => void;
  onUserAdded: (msg: string) => void;
  onToggleShopStatus: (shop: Shop) => Promise<void>;
}

function ManageShopModal({ shop, onClose, onUserAdded, onToggleShopStatus }: ManageShopModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'staff'>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const res = await adminUsersApi.list({ shopId: shop.id });
      const raw = res as unknown as { data?: User[] | { items: User[] }; items?: User[] };
      let list: User[] = [];
      if (Array.isArray(raw.data)) list = raw.data;
      else if (raw.data && 'items' in raw.data) list = raw.data.items;
      else if (Array.isArray(raw.items)) list = raw.items;
      setUsers(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUsers(false);
    }
  }, [shop.id]);

  useEffect(() => {
    if (activeTab === 'staff') fetchUsers();
  }, [activeTab, fetchUsers]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !password.trim()) {
      setError('Name, username, and password are required.');
      return;
    }
    setLoadingAdd(true);
    setError(null);
    try {
      await adminUsersApi.create({
        name: name.trim(),
        username: username.trim(),
        password: password.trim(),
        shopId: shop.id,
      });
      onUserAdded(`User ${name.trim()} added to ${shop.name}!`);
      setName(''); setUsername(''); setPassword('');
      setShowAddForm(false);
      fetchUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create user account.');
    } finally {
      setLoadingAdd(false);
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    const newStatus = !user.isActive;
    try {
      await adminUsersApi.update(user.id, { isActive: newStatus });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: newStatus } : u));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update user status.');
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15,10,12,0.55)',
        backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
        animation: 'adm-fade-in 0.15s ease',
      }}
    >
      <div
        style={{
          background: 'var(--white)', borderRadius: 'var(--r-xl)',
          boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: 800,
          margin: '0 16px', overflow: 'hidden', display: 'flex', flexDirection: 'column',
          maxHeight: '90vh',
          animation: 'adm-slide-up 0.2s ease',
        }}
      >
        {/* Header Section */}
        <div style={{
          padding: '28px 28px 0', 
          background: 'linear-gradient(to right, var(--white), var(--n-50))'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--r-md)',
                background: 'var(--a-600)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--white)', boxShadow: '0 8px 20px rgba(168, 0, 40, 0.2)'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M3 9.5L12 3l9 6.5V21a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--a-600)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                  Shop Dashboard
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  {shop.name}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="adm-btn adm-btn--ghost"
              style={{ borderRadius: '50%', width: 36, height: 36, padding: 0, minWidth: 36, border: 'none' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-bg)'; e.currentTarget.style.color = 'var(--danger)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Tabs Navigation */}
          <div className="adm-modal-tabs">
            <button
              className={`adm-modal-tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <svg className="adm-modal-tab-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Overview
            </button>
            <button
              className={`adm-modal-tab ${activeTab === 'staff' ? 'active' : ''}`}
              onClick={() => setActiveTab('staff')}
            >
              <svg className="adm-modal-tab-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100-8 4 4 0 000 8z" />
              </svg>
              Staff Accounts
            </button>
          </div>
        </div>

        {/* Modal Content Viewport */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          
          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ padding: '32px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                {/* Shop Information Card */}
                <div style={{ 
                  background: 'var(--white)', border: '1px solid var(--border)', 
                  borderRadius: 'var(--r-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)'
                }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 4, height: 14, background: 'var(--a-600)', borderRadius: 2 }} />
                    Business Details
                  </h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Email Address</label>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{shop.email}</div>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Contact Info</label>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{shop.contactInfo || 'Not provided'}</div>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Registration Date</label>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatDate(shop.createdAt)}</div>
                    </div>
                  </div>
                </div>

                {/* Plan & Status Card */}
                <div style={{ 
                  background: 'var(--white)', border: '1px solid var(--border)', 
                  borderRadius: 'var(--r-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)'
                }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 4, height: 14, background: 'var(--a-600)', borderRadius: 2 }} />
                    Subscription Information
                  </h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Current Plan</span>
                      <span className={`adm-badge ${PLAN_BADGE[shop.planId] || 'adm-badge--gray'}`} style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {shop.planId}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Shop Status</span>
                      <span className={`adm-badge ${shop.isActive ? 'adm-badge--green' : 'adm-badge--gray'}`}>
                        <span className="adm-badge-dot" />
                        {shop.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </div>

                    <div style={{ marginTop: 10, padding: '16px', background: 'var(--n-50)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
                       <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                         Manage shop availability. If deactivated, all staff accounts will lose access.
                       </div>
                       <button
                         onClick={() => onToggleShopStatus(shop)}
                         className={`adm-btn ${shop.isActive ? 'adm-btn--danger' : 'adm-btn--primary'}`}
                         style={{ width: '100%' }}
                       >
                         {shop.isActive ? 'Deactivate Shop' : 'Activate Shop'}
                       </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: STAFF ACCOUNTS */}
          {activeTab === 'staff' && (
            <div style={{ padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Staff Management</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>Control access for shop personnel.</p>
                </div>
                {!showAddForm && (
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="adm-btn adm-btn--primary"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    New Staff Account
                  </button>
                )}
              </div>

              {showAddForm && (
                <div style={{ 
                  background: 'var(--white)', border: '1px solid var(--a-300)', 
                  borderRadius: 'var(--r-lg)', padding: '24px', marginBottom: 32,
                  boxShadow: '0 8px 16px rgba(168,0,40,0.05)',
                  animation: 'adm-slide-up 0.3s ease'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>Add New Staff Member</h4>
                    <button onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                         <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <form onSubmit={handleCreateUser} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Full Name</label>
                      <input
                        type="text" className="adm-input" placeholder="e.g. John Doe"
                        value={name} onChange={e => setName(e.target.value)} required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Username</label>
                      <input
                        type="text" className="adm-input" placeholder="e.g. john_doe"
                        value={username} onChange={e => setUsername(e.target.value)} required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Initial Password</label>
                      <input
                        type="password" className="adm-input" placeholder="Min 8 characters"
                        value={password} onChange={e => setPassword(e.target.value)} minLength={8} required
                      />
                    </div>
                    <div style={{ gridColumn: 'span 3', display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                       {error && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginRight: 'auto', alignSelf: 'center' }}>{error}</span>}
                       <button type="button" className="adm-btn adm-btn--ghost" onClick={() => setShowAddForm(false)}>Cancel</button>
                       <button type="submit" className="adm-btn adm-btn--primary" disabled={loadingAdd}>
                         {loadingAdd ? 'Adding...' : 'Create Account'}
                       </button>
                    </div>
                  </form>
                </div>
              )}

              {loadingUsers ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', gap: 14 }}>
                  <span className="adm-spinner adm-spinner--dark" style={{ width: 32, height: 32 }} />
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Fetching accounts...</div>
                </div>
              ) : users.length === 0 ? (
                <div className="adm-empty" style={{ background: 'var(--white)', border: '1px dashed var(--border)', borderRadius: 'var(--r-xl)' }}>
                  <div className="adm-empty-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100-8 4 4 0 000 8z"/></svg></div>
                  <div className="adm-empty-title">No Staff Accounts</div>
                  <div className="adm-empty-desc">Get started by creating the first account for this shop.</div>
                </div>
              ) : (
                <div style={{ 
                  background: 'var(--white)', border: '1px solid var(--border)', 
                  borderRadius: 'var(--r-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)'
                }}>
                  <table className="adm-table" style={{ border: 'none' }}>
                    <thead>
                      <tr>
                        <th>Member</th>
                        <th>Credentials</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{
                                width: 34, height: 34, borderRadius: 10,
                                background: u.isActive ? 'var(--a-100)' : 'var(--n-100)',
                                color: u.isActive ? 'var(--a-600)' : 'var(--n-400)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.8rem', fontWeight: 700
                              }}>
                                {u.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                  {u.name}
                                  {u.forcePasswordChange && (
                                    <span title="Password reset required" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--warning)' }} />
                                  )}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Staff Member</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <code style={{ fontSize: '0.75rem', color: 'var(--a-700)', background: 'var(--a-50)', padding: '2px 6px', borderRadius: 4 }}>
                              @{u.username}
                            </code>
                          </td>
                          <td>
                            <span className={`adm-badge ${u.isActive ? 'adm-badge--green' : 'adm-badge--gray'}`} style={{ fontSize: '0.65rem' }}>
                              {u.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                              <button 
                                onClick={() => setResettingUser(u)}
                                className="adm-btn adm-btn--ghost" 
                                style={{ padding: '6px 12px', fontSize: '0.72rem' }}
                              >
                                Reset Pwd
                              </button>
                              <button 
                                onClick={() => handleToggleUserStatus(u)}
                                className={`adm-btn ${u.isActive ? 'adm-btn--danger' : 'adm-btn--ghost'}`}
                                style={{ padding: '6px 12px', fontSize: '0.72rem', color: u.isActive ? 'var(--danger)' : 'var(--success)' }}
                              >
                                {u.isActive ? 'Disable' : 'Enable'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Nested Reset Modal */}
        {resettingUser && (
          <ResetPasswordModal
            user={resettingUser}
            onClose={() => setResettingUser(null)}
            onReset={(msg) => {
              onUserAdded(msg);
              fetchUsers();
            }}
          />
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function ShopsPage() {
  const [shops,      setShops]      = useState<Shop[]>([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [search,     setSearch]     = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showModal,  setShowModal]  = useState(false);
  const [managingShop, setManagingShop] = useState<Shop | null>(null);
  const [toast,      setToast]      = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const fetchShops = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminShopsApi.list(
        debouncedSearch ? { search: debouncedSearch } : undefined
      );
      // Unwrap: { success, data, meta } or { success, data: { items, meta } }
      const raw = res as unknown as {
        data?: Shop[] | { items: Shop[]; meta: { total: number } };
        meta?: { total: number };
        items?: Shop[];
      };

      if (Array.isArray(raw.data)) {
        setShops(raw.data);
        setTotal(raw.meta?.total ?? raw.data.length);
      } else if (raw.data && 'items' in raw.data) {
        setShops(raw.data.items);
        setTotal(raw.data.meta?.total ?? raw.data.items.length);
      } else if (Array.isArray((raw as unknown as { items: Shop[] }).items)) {
        const r = raw as unknown as { items: Shop[]; meta: { total: number } };
        setShops(r.items);
        setTotal(r.meta?.total ?? r.items.length);
      } else {
        setShops([]);
        setTotal(0);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load shops.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => { fetchShops(); }, [fetchShops]);

  const handleCreated = (shop: Shop) => {
    setShops(prev => [shop, ...prev]);
    setTotal(prev => prev + 1);
    setShowModal(false);
    setToast({ msg: `"${shop.name}" created successfully!`, type: 'success' });
  };

  const handleToggleStatus = async (shop: Shop) => {
    const newStatus = !shop.isActive;
    try {
      await adminShopsApi.update(shop.id, { isActive: newStatus });
      setShops(prev => prev.map(s => s.id === shop.id ? { ...s, isActive: newStatus } : s));
      setToast({
        msg: `"${shop.name}" ${newStatus ? 'enabled' : 'disabled'} successfully!`,
        type: 'success'
      });
    } catch (err: unknown) {
      setToast({
        msg: err instanceof Error ? err.message : 'Failed to update shop status.',
        type: 'error'
      });
    }
  };

  return (
    <>
      {/* Keyframe animations injected inline */}
      <style>{`
        @keyframes adm-fade-in  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes adm-slide-up { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes adm-toast-in { from { opacity: 0; transform: translateX(16px) } to { opacity: 1; transform: translateX(0) } }
        .adm-badge--blue { background: var(--info-bg); color: var(--info); }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 2000,
          background: toast.type === 'success' ? 'var(--success)' : 'var(--danger)',
          color: '#fff',
          padding: '11px 18px',
          borderRadius: 'var(--r-md)',
          boxShadow: 'var(--shadow-lg)',
          fontSize: '0.875rem', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 8,
          animation: 'adm-toast-in 0.25s ease',
          maxWidth: 340,
        }}>
          {toast.type === 'success' ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8l3.5 3.5L13 5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          )}
          {toast.msg}
        </div>
      )}

      {/* Add Shop Modal */}
      {showModal && (
        <AddShopModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}

      {/* Manage Shop Modal (Add User) */}
      {managingShop && (
        <ManageShopModal
          shop={managingShop}
          onClose={() => setManagingShop(null)}
          onUserAdded={(msg: string) => setToast({ msg, type: 'success' })}
          onToggleShopStatus={handleToggleStatus}
        />
      )}

      {/* Top bar */}
      <header className="adm-topbar">
        <span className="adm-topbar-title">Shops</span>
        <span className="adm-topbar-badge">
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--a-500)', display: 'inline-block' }}/>
          {total} registered
        </span>
      </header>

      <div className="adm-page">
        {/* Page header */}
        <div className="adm-page-header">
          <div>
            <h1 className="adm-page-title">All Shops</h1>
            <p className="adm-page-subtitle">Manage registered shops, plans, and trial access.</p>
          </div>
          <button
            id="open-add-shop-modal"
            className="adm-btn adm-btn--primary"
            onClick={() => setShowModal(true)}
          >
            Add Shop
          </button>
        </div>

        {/* Toolbar */}
        <div className="adm-toolbar">
          <div className="adm-search-wrap">
            <svg className="adm-search-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <input
              className="adm-search"
              type="text"
              placeholder="Search by shop name…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              id="shops-search"
            />
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
            {loading ? 'Loading…' : `${shops.length} shop${shops.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{
            background: 'var(--danger-bg)', border: '1px solid rgba(220,38,38,0.2)',
            borderRadius: 'var(--r-md)', padding: '12px 16px',
            color: 'var(--danger)', fontSize: '0.875rem', fontWeight: 500,
            marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M7.5 4.5v4M7.5 10.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            {error}
            <button
              onClick={fetchShops}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontWeight: 700, fontSize: '0.83rem' }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Table */}
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Shop Name</th>
                <th>Contact</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                /* Skeleton rows */
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j}>
                        <div style={{
                          height: 14,
                          borderRadius: 6,
                          background: 'var(--n-100)',
                          width: j === 0 ? 20 : j === 6 ? 80 : '70%',
                        }}/>
                      </td>
                    ))}
                  </tr>
                ))
              ) : shops.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="adm-empty">
                      <div className="adm-empty-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <path d="M3 12.5L12 4l9 8.5V21a1 1 0 01-1 1H4a1 1 0 01-1-1v-8.5z" stroke="currentColor" strokeWidth="1.5"/>
                        </svg>
                      </div>
                      <div className="adm-empty-title">
                        {debouncedSearch ? 'No shops match your search' : 'No shops yet'}
                      </div>
                      <div className="adm-empty-desc">
                        {debouncedSearch
                          ? 'Try a different search term.'
                          : 'Click "Add Shop" to register the first shop.'}
                      </div>
                      {!debouncedSearch && (
                        <button
                          className="adm-btn adm-btn--primary"
                          onClick={() => setShowModal(true)}
                          style={{ marginTop: 16 }}
                        >
                          Add First Shop
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                shops.map((shop, i) => {
                  const status  = shopStatus(shop);
                  const planId  = shop.planId as string;
                  return (
                    <tr key={shop.id}>
                      <td style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{i + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{shop.name}</div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{shop.email}</div>
                        <div style={{ fontFamily: 'monospace', marginTop: 2 }}>{shop.contactInfo || <span style={{ color: 'var(--n-200)' }}>—</span>}</div>
                      </td>
                      <td>
                        <span className={`adm-badge ${PLAN_BADGE[planId] ?? 'adm-badge--gray'}`} style={{ textTransform: 'capitalize' }}>
                          {planId}
                        </span>
                      </td>
                      <td>
                        <span className={`adm-badge ${STATUS_BADGE[status] ?? 'adm-badge--gray'}`}>
                          <span className="adm-badge-dot"/>
                          {status}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{formatDate(shop.createdAt)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="adm-btn adm-btn--ghost"
                            style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                            onClick={() => setManagingShop(shop)}
                          >
                            Manage
                          </button>
                          <button
                            className={shop.isActive ? 'adm-btn adm-btn--danger' : 'adm-btn adm-btn--ghost'}
                            style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                            onClick={() => handleToggleStatus(shop)}
                          >
                            {shop.isActive ? 'Disable' : 'Enable'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
