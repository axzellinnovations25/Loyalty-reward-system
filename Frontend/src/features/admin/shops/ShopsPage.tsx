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
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Create Shop
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Manage Shop Modal ────────────────────────────────────────────────────────

interface ManageShopModalProps {
  shop: Shop;
  onClose: () => void;
  onUserAdded: (msg: string) => void;
}

function ManageShopModal({ shop, onClose, onUserAdded }: ManageShopModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const res = await adminUsersApi.list({ shopId: shop.id });
      // Ensure we unwrap { success, data } based on different formats
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

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Click outside to close
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
      fetchUsers(); // refresh the list
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create user account.');
    } finally {
      setLoadingAdd(false);
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
          boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: 700,
          margin: '0 16px', overflow: 'hidden', display: 'flex', flexDirection: 'column',
          maxHeight: '90vh',
          animation: 'adm-slide-up 0.2s ease',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px 16px', borderBottom: '1px solid var(--border)',
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.97rem', color: 'var(--text-primary)' }}>Manage Shop: {shop.name}</div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: 1 }}>
              Configure shop properties and staff accounts
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 6, borderRadius: 6, color: 'var(--text-secondary)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          {/* Left panel: Admin user creation form */}
          <div style={{ flex: 1, padding: '24px', borderRight: '1px solid var(--border)', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Add Staff Account</h3>
            
            <form onSubmit={handleCreateUser}>
              {error && (
                <div style={{
                  background: 'var(--danger-bg)', border: '1px solid rgba(220,38,38,0.2)',
                  borderRadius: 'var(--r-sm)', padding: '10px 14px',
                  color: 'var(--danger)', fontSize: '0.83rem', fontWeight: 500,
                  marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 8,
                }}>
                  {error}
                </div>
              )}

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: 6 }}>Name</label>
                <input
                  type="text" className="adm-input" placeholder="e.g. John Doe"
                  value={name} onChange={e => setName(e.target.value)} required
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: 6 }}>Login Username</label>
                <input
                  type="text" className="adm-input" placeholder="e.g. john_doe"
                  value={username} onChange={e => setUsername(e.target.value)} required
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: 6 }}>Initial Password</label>
                <input
                  type="text" className="adm-input" placeholder="Min 8 characters"
                  value={password} onChange={e => setPassword(e.target.value)} minLength={8} required
                />
              </div>

              <button type="submit" className="adm-btn adm-btn--primary" style={{ width: '100%' }} disabled={loadingAdd}>
                {loadingAdd ? 'Adding...' : 'Create Shop Account'}
              </button>
            </form>
          </div>

          {/* Right panel: Active accounts */}
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto', background: 'var(--n-50)' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
              Current Staff ({users.length})
            </h3>
            
            {loadingUsers ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Loading accounts...</div>
            ) : users.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '20px 0', textAlign: 'center' }}>
                No standard user accounts exist.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {users.map(u => (
                  <div key={u.id} style={{
                    background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
                    padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 16, background: 'var(--a-100)', color: 'var(--a-700)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem',
                      textTransform: 'uppercase'
                    }}>
                      {u.name.substring(0, 2)}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{u.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>@{u.username}</div>
                    </div>
                    {u.isActive ? (
                      <span className="adm-badge adm-badge--green" style={{ fontSize: '0.65rem' }}>Active</span>
                    ) : (
                      <span className="adm-badge adm-badge--gray" style={{ fontSize: '0.65rem' }}>Inactive</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
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
          onUserAdded={(msg) => setToast({ msg, type: 'success' })}
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
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
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
                          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
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
