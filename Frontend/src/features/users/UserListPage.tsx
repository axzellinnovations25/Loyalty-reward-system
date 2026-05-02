import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usersApi } from '../../api/users';
import type { User } from '../../types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function AddStaffModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    nameRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Name is required.');
    if (!username.trim()) return setError('Username is required.');
    if (password.trim().length < 6) return setError('Password must be at least 6 characters.');

    setLoading(true);
    setError(null);
    try {
      await usersApi.create({ name: name.trim(), username: username.trim(), password: password.trim() });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create staff user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      className="adm-modal-overlay"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="adm-modal adm-modal--sm">
        <div className="adm-modal-header">
          <div>
            <p className="adm-modal-title">Create Staff Account</p>
            <p className="adm-modal-subtitle">Staff can access POS and Sales only.</p>
          </div>
          <button type="button" className="adm-modal-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="adm-modal-body">
            {error && (
              <div className="adm-alert adm-alert--error" role="alert">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <div className="adm-form-group">
              <label className="adm-label">Name <span className="adm-label-required">*</span></label>
              <input ref={nameRef} className="adm-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Cashier 1" required />
            </div>

            <div className="adm-form-group">
              <label className="adm-label">Username <span className="adm-label-required">*</span></label>
              <input className="adm-input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. cashier1" required />
              <p className="adm-hint">Use a simple username (lowercase recommended).</p>
            </div>

            <div className="adm-form-group">
              <label className="adm-label">Temporary Password <span className="adm-label-required">*</span></label>
              <input className="adm-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 chars" required />
              <p className="adm-hint">Staff will be forced to change password on first login.</p>
            </div>
          </div>

          <div className="adm-modal-footer">
            <button type="button" className="adm-btn adm-btn--ghost" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="adm-btn adm-btn--primary" disabled={loading}>
              {loading ? <><span className="adm-spinner" style={{ marginRight: 6 }} />Creating…</> : 'Create Staff'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UserListPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await usersApi.list();
      const payload = (res as any).data ?? res;
      setUsers(Array.isArray(payload) ? payload : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load staff users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q));
  }, [search, users]);

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Staff Accounts</h1>
          <p className="adm-page-subtitle">{loading ? 'Loading…' : `${users.length} user${users.length !== 1 ? 's' : ''}`}</p>
        </div>
        <button className="adm-btn adm-btn--primary" onClick={() => setShowAdd(true)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create Staff
        </button>
      </div>

      <div className="adm-toolbar">
        <div className="adm-search-wrap" style={{ maxWidth: 420 }}>
          <svg className="adm-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input className="adm-search" placeholder="Search staff…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {search && <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => setSearch('')}>Clear</button>}
      </div>

      {error && (
        <div className="adm-alert adm-alert--error" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {!loading && filtered.length === 0 ? (
        <div className="adm-card" style={{ padding: 28, textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            {search ? 'No users match your search.' : 'No staff users yet.'}
          </p>
        </div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Username</th>
                <th style={{ textAlign: 'center' }}>Role</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'center' }}>Created</th>
                <th style={{ textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 800 }}>{u.name}</td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-secondary)' }}>{u.username}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`adm-badge ${u.role === 'owner' ? 'adm-badge--maroon' : 'adm-badge--gray'}`}>
                      {u.role === 'owner' ? 'Owner' : 'Staff'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`adm-badge ${u.isActive ? 'adm-badge--success' : 'adm-badge--gray'}`}>
                      {u.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{formatDate(u.createdAt)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button
                        className="adm-btn adm-btn--ghost adm-btn--sm"
                        disabled={u.role === 'owner'}
                        onClick={async () => {
                          const newPassword = prompt(`Reset password for ${u.name}. Enter new password:`);
                          if (!newPassword) return;
                          try {
                            await usersApi.resetPassword(u.id, { newPassword });
                            alert('Password reset. User will be forced to change password on next login.');
                          } catch (err: any) {
                            alert(err.message || 'Failed to reset password.');
                          }
                        }}
                      >
                        Reset Password
                      </button>
                      <button
                        className="adm-btn adm-btn--ghost adm-btn--sm"
                        style={{ color: 'var(--danger)' }}
                        disabled={u.role === 'owner' || !u.isActive}
                        onClick={async () => {
                          if (!confirm(`Disable ${u.name}?`)) return;
                          try {
                            await usersApi.delete(u.id);
                            fetchUsers();
                          } catch (err: any) {
                            alert(err.message || 'Failed to disable user.');
                          }
                        }}
                      >
                        Disable
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <AddStaffModal
          onClose={() => setShowAdd(false)}
          onSuccess={() => {
            setShowAdd(false);
            fetchUsers();
          }}
        />
      )}
    </div>
  );
}
