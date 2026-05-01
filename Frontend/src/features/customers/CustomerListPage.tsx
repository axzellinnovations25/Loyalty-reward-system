import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { customersApi } from '../../api/customers';
import type { Customer } from '../../types';
import AddCustomerModal from './AddCustomerModal';
import EditCustomerModal from './EditCustomerModal';

export default function CustomerListPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const fetchCustomers = useCallback(async (searchQuery = '') => {
    setLoading(true);
    setError(null);
    try {
      const res = await customersApi.list({ search: searchQuery });
      const payload = (res as any).data ?? res;
      const items = payload.items ?? (Array.isArray(payload) ? payload : []);
      const metaTotal = payload.meta?.total ?? items.length;
      setCustomers(items);
      setTotal(metaTotal);
    } catch (err: any) {
      setError(err.message || 'Failed to load customers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => fetchCustomers(search), 400);
    return () => clearTimeout(timeout);
  }, [search, fetchCustomers]);

  const handleAddSuccess = (customer: Customer) => {
    setShowAddModal(false);
    navigate(`/customers/${customer.id}`);
  };

  const handleEditSuccess = () => {
    setEditingCustomer(null);
    fetchCustomers(search);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const formatShortDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

  return (
    <div className="adm-page">
      {/* Page Header */}
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Customers</h1>
          <p className="adm-page-subtitle">
            {loading ? 'Loading…' : `${total} member${total !== 1 ? 's' : ''} registered`}
          </p>
        </div>
        <button
          id="add-customer-btn"
          className="adm-btn adm-btn--primary"
          onClick={() => setShowAddModal(true)}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Customer
        </button>
      </div>

      {/* Toolbar */}
      <div className="adm-toolbar">
        <div className="adm-search-wrap" style={{ maxWidth: 400 }}>
          <svg className="adm-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            id="customer-search"
            type="text"
            className="adm-search"
            placeholder="Search by name or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {search && (
          <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => setSearch('')}>
            Clear
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="adm-alert adm-alert--error" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && customers.length === 0 ? (
        <div className="adm-card">
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 22px', borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
              <div className="adm-skeleton" style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="adm-skeleton" style={{ width: '40%', height: 14 }} />
                <div className="adm-skeleton" style={{ width: '25%', height: 12 }} />
              </div>
              <div className="adm-skeleton" style={{ width: 80, height: 26, borderRadius: 20 }} />
            </div>
          ))}
        </div>
      ) : customers.length === 0 ? (
        <div className="adm-card">
          <div className="adm-empty">
            <div className="adm-empty-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <p className="adm-empty-title">
              {search ? 'No results found' : 'No customers yet'}
            </p>
            <p className="adm-empty-desc">
              {search
                ? `No customer matched "${search}". Try a different name or phone.`
                : 'Add your first customer to start tracking loyalty points.'}
            </p>
            {!search && (
              <button
                className="adm-btn adm-btn--primary"
                style={{ marginTop: 16 }}
                onClick={() => setShowAddModal(true)}
              >
                Add First Customer
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th style={{ textAlign: 'center' }}>Points</th>
                <th style={{ textAlign: 'center' }}>Last Active</th>
                <th style={{ textAlign: 'center' }}>Member Since</th>
                <th style={{ textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  {/* Name + Avatar */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="adm-avatar-md">
                        {c.name[0]?.toUpperCase()}
                      </div>
                      <button
                        onClick={() => navigate(`/customers/${c.id}`)}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
                      >
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                          {c.name}
                        </div>
                      </button>
                    </div>
                  </td>

                  {/* Phone */}
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {c.phone}
                    </span>
                  </td>

                  {/* Points */}
                  <td style={{ textAlign: 'center' }}>
                    <span className={`adm-badge ${c.totalPoints > 0 ? 'adm-badge--maroon' : 'adm-badge--gray'}`}>
                      {c.totalPoints.toLocaleString()} pts
                    </span>
                  </td>

                  {/* Last Active */}
                  <td style={{ textAlign: 'center' }}>
                    {c.lastActivityAt ? (
                      <span style={{ fontSize: '0.82rem', color: 'var(--success)', fontWeight: 600 }}>
                        {formatShortDate(c.lastActivityAt)}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>

                  {/* Member Since */}
                  <td style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {formatDate(c.createdAt)}
                  </td>

                  {/* Actions */}
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button
                        id={`view-customer-${c.id}`}
                        className="adm-btn adm-btn--ghost adm-btn--sm"
                        onClick={() => navigate(`/customers/${c.id}`)}
                      >
                        View
                      </button>
                      <button
                        id={`edit-customer-${c.id}`}
                        className="adm-btn adm-btn--ghost adm-btn--sm adm-btn--icon"
                        title="Edit customer"
                        onClick={(e) => { e.stopPropagation(); setEditingCustomer(c); }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddCustomerModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}
      {editingCustomer && (
        <EditCustomerModal
          customer={editingCustomer}
          onClose={() => setEditingCustomer(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
