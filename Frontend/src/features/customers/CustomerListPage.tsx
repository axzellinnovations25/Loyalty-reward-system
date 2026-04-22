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
      // Backend returns: { success: true, data: { items: [], meta: {} } }
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
    const timeout = setTimeout(() => {
      fetchCustomers(search);
    }, 400);
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

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        background: '#fff', padding: '20px 32px', borderBottom: '1px solid #e2e8f0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '16px', position: 'sticky', top: 0, zIndex: 20
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#1e293b' }}>
            Customers
          </h1>
          <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
            {total} member{total !== 1 ? 's' : ''} registered
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>

          <button
            onClick={() => setShowAddModal(true)}
            className="shop-btn shop-btn--primary"
            style={{ padding: '10px 18px', fontWeight: 700 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}>
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Customer
          </button>
        </div>
      </div>

      <div style={{ padding: '24px 32px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Search */}
        <div style={{ marginBottom: '20px', position: 'relative', maxWidth: '480px' }}>
          <svg
            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}
            width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          >
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by name or phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px 10px 42px',
              border: '1px solid #e2e8f0', borderRadius: '8px',
              fontSize: '0.9rem', background: '#fff', outline: 'none',
              boxSizing: 'border-box', color: '#1e293b'
            }}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: '8px', color: '#b91c1c', fontSize: '0.875rem',
            fontWeight: 600, marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && customers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{
              width: '36px', height: '36px', border: '3px solid #e2e8f0',
              borderTopColor: '#a80028', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite', margin: '0 auto 16px'
            }} />
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Loading customers...</p>
          </div>
        ) : customers.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 40px',
            background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>👥</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: '0 0 8px' }}>
              {search ? 'No results found' : 'No customers yet'}
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: '0 0 20px' }}>
              {search ? `No customer matched "${search}". Try a different name or phone.` : 'Add your first customer to start tracking loyalty points.'}
            </p>
            {!search && (
              <button className="shop-btn shop-btn--primary" onClick={() => setShowAddModal(true)}>
                Add First Customer
              </button>
            )}
          </div>
        ) : (
          <div style={{
            background: '#fff', borderRadius: '12px',
            border: '1px solid #e2e8f0', overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ textAlign: 'left', padding: '14px 20px', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer</th>
                    <th style={{ textAlign: 'left', padding: '14px 20px', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone</th>
                    <th style={{ textAlign: 'center', padding: '14px 20px', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Points</th>
                    <th style={{ textAlign: 'center', padding: '14px 20px', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Active</th>
                    <th style={{ textAlign: 'right', padding: '14px 20px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      {/* Name */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '38px', height: '38px', borderRadius: '50%',
                            background: '#fdf2f4', color: '#a80028',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 800, fontSize: '0.9rem', flexShrink: 0
                          }}>
                            {c.name[0]?.toUpperCase()}
                          </div>
                          <button
                            onClick={() => navigate(`/customers/${c.id}`)}
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
                          >
                            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>{c.name}</div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                              Since {new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                          </button>
                        </div>
                      </td>
                      {/* Phone */}
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontSize: '0.875rem', color: '#475569', fontWeight: 600, fontFamily: 'monospace' }}>{c.phone}</span>
                      </td>
                      {/* Points */}
                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block', background: c.totalPoints > 0 ? '#fdf2f4' : '#f1f5f9',
                          color: c.totalPoints > 0 ? '#a80028' : '#94a3b8',
                          padding: '4px 12px', borderRadius: '20px',
                          fontSize: '0.8rem', fontWeight: 800
                        }}>
                          {c.totalPoints.toLocaleString()} pts
                        </span>
                      </td>
                      {/* Last active */}
                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                        {c.lastActivityAt ? (
                          <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600 }}>
                            {new Date(c.lastActivityAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button
                              className="shop-btn shop-btn--ghost"
                              title="View profile"
                              onClick={() => navigate(`/customers/${c.id}`)}
                              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                            >
                              View
                            </button>
                            <button
                              className="shop-btn shop-btn--ghost"
                              title="Edit customer"
                              onClick={(e) => { e.stopPropagation(); setEditingCustomer(c); }}
                              style={{ padding: '6px 10px' }}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
          </div>
        )}
      </div>

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

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
