import { useState, useEffect, useCallback, useRef } from 'react';
import { adminShopsApi } from '../../../api/admin/shops';
import { adminUsersApi } from '../../../api/admin/users';
import type { Shop, PlanId, User } from '../../../types';
import './shops.css';

// ── Constants ─────────────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────────

function shopStatus(shop: Shop): string {
  if (!shop.isActive) return 'inactive';
  if (shop.trialPlanId && shop.trialExpiresAt && new Date(shop.trialExpiresAt) > new Date()) return 'trial';
  return 'active';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Add Shop Modal ────────────────────────────────────────────────

interface AddShopModalProps {
  onClose: () => void;
  onCreated: (shop: Shop) => void;
}

function AddShopModal({ onClose, onCreated }: AddShopModalProps) {
  const [name,          setName]          = useState('');
  const [email,         setEmail]         = useState('');
  const [phone,         setPhone]         = useState('');
  const [ownerName,     setOwnerName]     = useState('');
  const [ownerUsername, setOwnerUsername] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [planId,        setPlanId]        = useState<PlanId>('basic');
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const nameRef    = useRef<HTMLInputElement>(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

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
    if (!name.trim() || !email.trim() || !ownerName.trim() || !ownerUsername.trim() || !ownerPassword.trim()) {
      setError('All fields except phone number are required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await adminShopsApi.create({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        planId,
        ownerName: ownerName.trim(),
        ownerUsername: ownerUsername.trim(),
        ownerPassword: ownerPassword.trim(),
      });
      const shop = (res as unknown as { data: Shop }).data ?? (res as unknown as Shop);
      onCreated(shop);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create shop.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={overlayRef} onClick={handleOverlayClick} className="add-shop-overlay">
      <div className="add-shop-panel">
        {/* Header */}
        <div className="add-shop-header">
          <div className="add-shop-header-left">
            <div className="add-shop-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M3 9.5L12 3l9 6.5V21a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.6"/>
              </svg>
            </div>
            <div>
              <div className="add-shop-title">Add New Shop</div>
              <div className="add-shop-subtitle">Creates the shop with default settings</div>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="add-shop-close">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <form id="add-shop-form" onSubmit={handleSubmit} className="add-shop-body">
          {error && (
            <div className="add-shop-error">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="add-shop-error-icon" aria-hidden="true">
                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M7 4v3.5M7 9.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              {error}
            </div>
          )}

          <div className="add-shop-field">
            <label className="add-shop-label" htmlFor="add-shop-name">
              Shop Name <span className="add-shop-label-req">*</span>
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

          <div className="add-shop-field">
            <label className="add-shop-label" htmlFor="add-shop-email">
              Shop Email <span className="add-shop-label-req">*</span>
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

          <div className="add-shop-field">
            <label className="add-shop-label" htmlFor="add-shop-contact">
              Phone Number
              <span className="add-shop-label-opt">optional</span>
            </label>
            <input
              id="add-shop-contact"
              type="tel"
              className="adm-input"
              placeholder="e.g. +1 234 567 890"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              maxLength={200}
            />
          </div>

          <div className="add-shop-owner-section">
            <div className="add-shop-owner-title">Owner Account Details</div>
            <div className="add-shop-owner-name">
              <label className="add-shop-owner-label" htmlFor="add-shop-owner-name">Full Name</label>
              <input
                id="add-shop-owner-name"
                type="text"
                className="adm-input"
                placeholder="Owner's full name"
                value={ownerName}
                onChange={e => setOwnerName(e.target.value)}
                required
              />
            </div>
            <div className="add-shop-owner-row">
              <div>
                <label className="add-shop-owner-label" htmlFor="add-shop-owner-username">Username</label>
                <input
                  id="add-shop-owner-username"
                  type="text"
                  className="adm-input"
                  placeholder="Login username"
                  value={ownerUsername}
                  onChange={e => setOwnerUsername(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="add-shop-owner-label" htmlFor="add-shop-owner-password">Initial Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="add-shop-owner-password"
                    type={showPassword ? 'text' : 'password'}
                    className="adm-input"
                    placeholder="Min 8 characters"
                    value={ownerPassword}
                    onChange={e => setOwnerPassword(e.target.value)}
                    required
                    minLength={8}
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary, #64748b)',
                      cursor: 'pointer',
                      padding: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 2
                    }}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="add-shop-plan-field">
            <label className="add-shop-label">
              Plan <span className="add-shop-label-req">*</span>
            </label>
            <div className="add-shop-plan-grid">
              {PLANS.map(p => (
                <label
                  key={p.id}
                  htmlFor={`plan-${p.id}`}
                  className={`add-shop-plan-option ${planId === p.id ? 'add-shop-plan-option--active' : 'add-shop-plan-option--idle'}`}
                >
                  <input
                    id={`plan-${p.id}`}
                    type="radio"
                    name="planId"
                    value={p.id}
                    checked={planId === p.id}
                    onChange={() => setPlanId(p.id)}
                    className="add-shop-plan-radio"
                  />
                  <span className={`add-shop-plan-label ${planId === p.id ? 'add-shop-plan-label--active' : 'add-shop-plan-label--idle'}`}>
                    {p.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="add-shop-footer">
          <button type="button" className="adm-btn adm-btn--ghost" onClick={onClose} disabled={loading}>
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
                <span className="adm-spinner add-shop-spinner" />
                Creating…
              </>
            ) : 'Create Shop'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Reset Password Modal ──────────────────────────────────────────
interface ResetPasswordModalProps {
  user: User;
  onClose: () => void;
  onReset: (msg: string) => void;
}

function ResetPasswordModal({ user, onClose, onReset }: ResetPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
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
    <div ref={overlayRef} onClick={handleOverlayClick} className="reset-pwd-overlay">
      <div className="reset-pwd-panel">
        <div className="reset-pwd-header">
          <div className="reset-pwd-title">Reset Password</div>
          <div className="reset-pwd-subtitle">
            Set a temporary password for <strong>{user.username}</strong>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="reset-pwd-body">
          {error && <div className="reset-pwd-error">{error}</div>}
          <div className="reset-pwd-field">
            <label className="reset-pwd-label" htmlFor="reset-pwd-input">Temporary Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="reset-pwd-input"
                type={showPassword ? 'text' : 'password'}
                className="adm-input"
                placeholder="Min 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                minLength={8}
                required
                autoFocus
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary, #64748b)',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2
                }}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            </div>
          </div>
          <div className="reset-pwd-actions">
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

// ── Manage Shop Modal ─────────────────────────────────────────────

interface ManageShopModalProps {
  shop: Shop;
  onClose: () => void;
  onUserAdded: (msg: string) => void;
  onToggleShopStatus: (shop: Shop) => Promise<void>;
  onPlanChanged: (shop: Shop) => void;
}

function ManageShopModal({ shop, onClose, onUserAdded, onToggleShopStatus, onPlanChanged }: ManageShopModalProps) {
  const [activeTab,      setActiveTab]      = useState<'overview' | 'owner'>('overview');
  const [users,          setUsers]          = useState<User[]>([]);
  const [loadingUsers,   setLoadingUsers]   = useState(true);
  const [name,           setName]           = useState('');
  const [username,       setUsername]       = useState('');
  const [password,       setPassword]       = useState('');
  const [showPassword,   setShowPassword]   = useState(false);
  const [loadingAdd,     setLoadingAdd]     = useState(false);
  const [showAddForm,    setShowAddForm]    = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [resettingUser,  setResettingUser]  = useState<User | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>(shop.planId as PlanId);
  const [changingPlan,   setChangingPlan]   = useState(false);
  const [planError,      setPlanError]      = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setSelectedPlanId(shop.planId as PlanId); }, [shop.planId]);

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
    if (activeTab === 'owner') fetchUsers();
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
      onUserAdded(`Owner account ${name.trim()} created for ${shop.name}!`);
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

  const handleChangePlan = async () => {
    setChangingPlan(true);
    setPlanError(null);
    try {
      const res = await adminShopsApi.assignPlan(shop.id, { planId: selectedPlanId });
      const updatedShop = (res as unknown as { data: Shop }).data ?? (res as unknown as Shop);
      onPlanChanged(updatedShop);
    } catch (err: unknown) {
      setPlanError(err instanceof Error ? err.message : 'Failed to change plan.');
    } finally {
      setChangingPlan(false);
    }
  };

  return (
    <div ref={overlayRef} onClick={handleOverlayClick} className="manage-overlay">
      <div className="manage-panel">
        {/* Header */}
        <div className="manage-header">
          <div className="manage-header-top">
            <div className="manage-header-left">
              <div className="manage-shop-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M3 9.5L12 3l9 6.5V21a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <div className="manage-shop-eyebrow">Shop Dashboard</div>
                <div className="manage-shop-name">{shop.name}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="adm-btn adm-btn--ghost manage-close-btn"
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <div className="adm-modal-tabs">
            <button
              type="button"
              className={`adm-modal-tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <svg className="adm-modal-tab-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Overview
            </button>
            <button
              type="button"
              className={`adm-modal-tab ${activeTab === 'owner' ? 'active' : ''}`}
              onClick={() => setActiveTab('owner')}
            >
              <svg className="adm-modal-tab-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100-8 4 4 0 000 8z" />
              </svg>
              Owner Account
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="manage-viewport">

          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="manage-overview">
              <div className="manage-two-col">
                {/* Business Details */}
                <div className="manage-card">
                  <h4 className="manage-card-title">
                    <div className="manage-card-accent" />
                    Business Details
                  </h4>
                  <div className="manage-detail-list">
                    <div>
                      <label className="manage-detail-label">Email Address</label>
                      <div className="manage-detail-value">{shop.email}</div>
                    </div>
                    <div>
                      <label className="manage-detail-label">Contact Info</label>
                      <div className="manage-detail-value">{shop.phone || 'Not provided'}</div>
                    </div>
                    <div>
                      <label className="manage-detail-label">Registration Date</label>
                      <div className="manage-detail-value">{formatDate(shop.createdAt)}</div>
                    </div>
                  </div>
                </div>

                {/* Subscription */}
                <div className="manage-card">
                  <h4 className="manage-card-title">
                    <div className="manage-card-accent" />
                    Subscription Information
                  </h4>
                  <div className="manage-sub-list">
                    <div className="manage-sub-row">
                      <span className="manage-sub-row-label">Current Plan</span>
                      <span className={`adm-badge shops-badge-capitalize ${PLAN_BADGE[shop.planId] || 'adm-badge--gray'}`}>
                        {shop.planId}
                      </span>
                    </div>

                    <div className="manage-plan-box">
                      <div className="manage-plan-box-label">Change Plan</div>
                      <div className="manage-plan-change-row">
                        <select
                          className="manage-plan-select"
                          aria-label="Select plan"
                          value={selectedPlanId}
                          onChange={e => setSelectedPlanId(e.target.value as PlanId)}
                          disabled={changingPlan}
                        >
                          {PLANS.map(p => (
                            <option key={p.id} value={p.id}>{p.label}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="adm-btn adm-btn--primary manage-plan-save-btn"
                          disabled={selectedPlanId === shop.planId || changingPlan}
                          onClick={handleChangePlan}
                        >
                          {changingPlan ? 'Saving…' : 'Save'}
                        </button>
                      </div>
                      {planError && <div className="manage-plan-error">{planError}</div>}
                    </div>

                    <div className="manage-sub-row">
                      <span className="manage-sub-row-label">Shop Status</span>
                      <span className={`adm-badge ${shop.isActive ? 'adm-badge--green' : 'adm-badge--gray'}`}>
                        <span className="adm-badge-dot" />
                        {shop.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </div>
                    <div className="manage-toggle-box">
                      <div className="manage-toggle-desc">
                        Manage shop availability. If deactivated, the owner account will lose access.
                      </div>
                      <button
                        type="button"
                        onClick={() => onToggleShopStatus(shop)}
                        className={`adm-btn manage-toggle-btn ${shop.isActive ? 'adm-btn--danger' : 'adm-btn--primary'}`}
                      >
                        {shop.isActive ? 'Deactivate Shop' : 'Activate Shop'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: OWNER ACCOUNT */}
          {activeTab === 'owner' && (
            <div className="manage-owner">
              <div className="manage-owner-top">
                <div>
                  <h3 className="manage-owner-title">Owner Account</h3>
                  <p className="manage-owner-subtitle">Manage the shop owner's login credentials and access. Staff members are created and managed by the shop owner — they do not appear here.</p>
                </div>
                {!showAddForm && users.length === 0 && (
                  <button type="button" onClick={() => setShowAddForm(true)} className="adm-btn adm-btn--primary">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Create Owner Account
                  </button>
                )}
              </div>

              {showAddForm && (
                <div className="manage-add-form-wrap">
                  <div className="manage-add-form-top">
                    <h4 className="manage-add-form-title">Set Shop Owner</h4>
                    <button type="button" onClick={() => setShowAddForm(false)} aria-label="Dismiss" className="manage-add-form-dismiss">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <form onSubmit={handleCreateUser} className="manage-add-form-grid">
                    <div>
                      <label className="manage-add-form-label" htmlFor="owner-name">Full Name</label>
                      <input id="owner-name" type="text" className="adm-input" placeholder="e.g. John Doe"
                        value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div>
                      <label className="manage-add-form-label" htmlFor="owner-username">Username</label>
                      <input id="owner-username" type="text" className="adm-input" placeholder="e.g. john_doe"
                        value={username} onChange={e => setUsername(e.target.value)} required />
                    </div>
                    <div>
                      <label className="manage-add-form-label" htmlFor="owner-password">Initial Password</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          id="owner-password"
                          type={showPassword ? 'text' : 'password'}
                          className="adm-input"
                          placeholder="Min 8 characters"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          minLength={8}
                          required
                          style={{ paddingRight: 40 }}
                        />
                        <button
                          type="button"
                          style={{
                            position: 'absolute',
                            right: 12,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-secondary, #64748b)',
                            cursor: 'pointer',
                            padding: 4,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 2
                          }}
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="manage-add-form-footer">
                      {error && <span className="manage-add-form-error">{error}</span>}
                      <button type="button" className="adm-btn adm-btn--ghost" onClick={() => setShowAddForm(false)}>Cancel</button>
                      <button type="submit" className="adm-btn adm-btn--primary" disabled={loadingAdd}>
                        {loadingAdd ? 'Setting...' : 'Create Account'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {loadingUsers ? (
                <div className="manage-loading">
                  <span className="adm-spinner adm-spinner--dark manage-loading-spinner" />
                  <div className="manage-loading-text">Fetching accounts...</div>
                </div>
              ) : users.length === 0 ? (
                <div className={`adm-empty manage-empty-wrap`}>
                  <div className="adm-empty-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100-8 4 4 0 000 8z"/>
                    </svg>
                  </div>
                  <div className="adm-empty-title">No Owner Account</div>
                  <div className="adm-empty-desc">No owner account has been set up for this shop. Create one to allow the shop owner to log in. Staff accounts are managed by the shop owner.</div>
                </div>
              ) : (
                <div className="manage-user-table-wrap">
                  <table className="adm-table manage-user-table">
                    <thead>
                      <tr>
                        <th>Owner</th>
                        <th>Credentials</th>
                        <th>Status</th>
                        <th className="manage-th-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id}>
                          <td>
                            <div className="manage-user-cell-owner">
                              <div className={`manage-user-avatar ${u.isActive ? 'manage-user-avatar--active' : 'manage-user-avatar--inactive'}`}>
                                {u.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="manage-user-name-row">
                                  {u.name}
                                  {u.forcePasswordChange && (
                                    <span title="Password reset required" className="manage-user-pwd-dot" />
                                  )}
                                </div>
                                <div className="manage-user-role">Shop Owner</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <code className="manage-user-code">@{u.username}</code>
                          </td>
                          <td>
                            <span className={`adm-badge manage-user-status-badge ${u.isActive ? 'adm-badge--green' : 'adm-badge--gray'}`}>
                              {u.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="manage-user-actions-cell">
                            <div className="manage-user-actions">
                              <button
                                type="button"
                                onClick={() => setResettingUser(u)}
                                className="adm-btn adm-btn--ghost manage-user-btn"
                              >
                                Reset Pwd
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleUserStatus(u)}
                                className={`adm-btn manage-user-btn ${u.isActive ? 'adm-btn--danger' : 'adm-btn--ghost manage-user-enable-btn'}`}
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

// ── Main Page ─────────────────────────────────────────────────────

export default function ShopsPage() {
  const [shops,           setShops]           = useState<Shop[]>([]);
  const [total,           setTotal]           = useState(0);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState<string | null>(null);
  const [search,          setSearch]          = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showModal,       setShowModal]       = useState(false);
  const [managingShop,    setManagingShop]    = useState<Shop | null>(null);
  const [toast,           setToast]           = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

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
      setToast({ msg: `"${shop.name}" ${newStatus ? 'enabled' : 'disabled'} successfully!`, type: 'success' });
    } catch (err: unknown) {
      setToast({ msg: err instanceof Error ? err.message : 'Failed to update shop status.', type: 'error' });
    }
  };

  return (
    <>
      <style>{`.adm-badge--blue { background: var(--info-bg); color: var(--info); }`}</style>

      {/* Toast */}
      {toast && (
        <div className={`shops-toast shops-toast--${toast.type}`}>
          {toast.type === 'success' ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8l3.5 3.5L13 5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          )}
          {toast.msg}
        </div>
      )}

      {showModal && <AddShopModal onClose={() => setShowModal(false)} onCreated={handleCreated} />}

      {managingShop && (
        <ManageShopModal
          shop={managingShop}
          onClose={() => setManagingShop(null)}
          onUserAdded={(msg: string) => setToast({ msg, type: 'success' })}
          onToggleShopStatus={handleToggleStatus}
          onPlanChanged={(updatedShop) => {
            setManagingShop(updatedShop);
            setShops(prev => prev.map(s => s.id === updatedShop.id ? updatedShop : s));
            setToast({ msg: `"${updatedShop.name}" moved to ${updatedShop.planId} plan.`, type: 'success' });
          }}
        />
      )}

      {/* Top bar */}
      <header className="adm-topbar">
        <span className="adm-topbar-title">Shops</span>
        <span className="adm-topbar-badge">
          <span className="shops-badge-dot" />
          {total} registered
        </span>
      </header>

      <div className="adm-page">
        <div className="adm-page-header">
          <div>
            <h1 className="adm-page-title">All Shops</h1>
            <p className="adm-page-subtitle">Manage registered shops, plans, and trial access.</p>
          </div>
          <button type="button" id="open-add-shop-modal" className="adm-btn adm-btn--primary" onClick={() => setShowModal(true)}>
            Add Shop
          </button>
        </div>

        <div className="adm-toolbar">
          <div className="adm-search-wrap">
            <svg className="adm-search-icon" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
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
          <span className="shops-count-label">
            {loading ? 'Loading…' : `${shops.length} shop${shops.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        {error && (
          <div className="shops-error-banner">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
              <circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M7.5 4.5v4M7.5 10.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            {error}
            <button type="button" onClick={fetchShops} className="shops-error-retry">Retry</button>
          </div>
        )}

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
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j}>
                        <div className={`shops-skel ${j === 0 ? 'shops-skel--xs' : j === 6 ? 'shops-skel--sm' : 'shops-skel--md'}`} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : shops.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="adm-empty">
                      <div className="adm-empty-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
                        <button type="button" className="adm-btn adm-btn--primary shops-empty-cta" onClick={() => setShowModal(true)}>
                          Add First Shop
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                shops.map((shop, i) => {
                  const status = shopStatus(shop);
                  const planId = shop.planId as string;
                  return (
                    <tr key={shop.id}>
                      <td className="shops-cell-num">{i + 1}</td>
                      <td><div className="shops-cell-name">{shop.name}</div></td>
                      <td>
                        <div className="shops-cell-email">{shop.email}</div>
                        <div className="shops-cell-phone">
                          {shop.phone || <span className="shops-cell-phone-empty">—</span>}
                        </div>
                      </td>
                      <td>
                        <span className={`adm-badge shops-badge-capitalize ${PLAN_BADGE[planId] ?? 'adm-badge--gray'}`}>
                          {planId}
                        </span>
                      </td>
                      <td>
                        <span className={`adm-badge ${STATUS_BADGE[status] ?? 'adm-badge--gray'}`}>
                          <span className="adm-badge-dot"/>
                          {status}
                        </span>
                      </td>
                      <td className="shops-cell-date">{formatDate(shop.createdAt)}</td>
                      <td>
                        <div className="shops-cell-actions">
                          <button
                            type="button"
                            className="adm-btn adm-btn--ghost shops-btn-sm"
                            onClick={() => setManagingShop(shop)}
                          >
                            Manage
                          </button>
                          <button
                            type="button"
                            className={`adm-btn shops-btn-sm ${shop.isActive ? 'adm-btn--danger' : 'adm-btn--ghost'}`}
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
