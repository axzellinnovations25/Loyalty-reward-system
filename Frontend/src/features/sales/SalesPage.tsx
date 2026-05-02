import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { purchasesApi } from '../../api/purchases';
import { posApi } from '../../api/pos';
import type { Purchase } from '../../types';

function toNumber(v: any): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SalesPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await purchasesApi.list({ page, limit });
      const payload = (res as any).data ?? res;
      const rows = payload.items ?? (Array.isArray(payload) ? payload : []);
      const metaTotal = payload.meta?.total ?? rows.length;
      setItems(rows);
      setTotal(metaTotal);
    } catch (err: any) {
      setError(err.message || 'Failed to load sales.');
    } finally {
      setLoading(false);
    }
  }, [limit, page]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((p) => {
      const customerName = p.customer?.name?.toLowerCase() || '';
      const customerPhone = p.customer?.phone?.toLowerCase() || '';
      return (
        p.id.toLowerCase().includes(q) ||
        customerName.includes(q) ||
        customerPhone.includes(q) ||
        String(p.amount).toLowerCase().includes(q)
      );
    });
  }, [items, search]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Sales</h1>
          <p className="adm-page-subtitle">
            {loading ? 'Loading…' : `${total} sale${total !== 1 ? 's' : ''} recorded`}
          </p>
        </div>
      </div>

      <div className="adm-toolbar" style={{ gap: 10, flexWrap: 'wrap' }}>
        <div className="adm-search-wrap" style={{ maxWidth: 420 }}>
          <svg className="adm-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="adm-search"
            placeholder="Search customer / phone / amount…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className="adm-btn adm-btn--ghost adm-btn--sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
          >
            Prev
          </button>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
            Page {page} / {totalPages}
          </div>
          <button
            className="adm-btn adm-btn--ghost adm-btn--sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
          >
            Next
          </button>
        </div>
      </div>

      {error && (
        <div className="adm-alert adm-alert--error" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {!loading && filtered.length === 0 ? (
        <div className="adm-card" style={{ padding: 28, textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            {search ? 'No sales match your search.' : 'No sales recorded yet.'}
          </p>
        </div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th style={{ textAlign: 'center' }}>Points</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const amount = toNumber(p.amount);
                return (
                  <tr key={p.id}>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
                      {formatDateTime(p.createdAt)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{p.customer?.name || '—'}</div>
                        <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          {p.customer?.phone || ''}
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 900 }}>
                      Rs. {amount.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`adm-badge ${p.pointsEarned > 0 ? 'adm-badge--success' : 'adm-badge--gray'}`}>
                        +{p.pointsEarned}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`adm-badge ${p.isVoided ? 'adm-badge--gray' : 'adm-badge--success'}`}>
                        {p.isVoided ? 'Voided' : 'Completed'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button
                          className="adm-btn adm-btn--ghost adm-btn--sm"
                          disabled={p.isVoided}
                          onClick={() => navigate(`/pos?returnPurchaseId=${p.id}`)}
                        >
                          Return
                        </button>
                        <button
                          className="adm-btn adm-btn--ghost adm-btn--sm"
                          disabled={p.isVoided}
                          onClick={async () => {
                            const reason = prompt('Refund reason', 'Customer refund');
                            if (!reason) return;
                            try {
                              await posApi.createRefund({ purchaseId: p.id, reason, method: 'original_payment' });
                              fetchSales();
                            } catch (err: any) {
                              alert(err.message || 'Failed to refund sale.');
                            }
                          }}
                        >
                          Refund
                        </button>
                        <button
                          className="adm-btn adm-btn--ghost adm-btn--sm"
                          style={{ color: p.isVoided ? 'var(--text-muted)' : 'var(--danger)' }}
                          disabled={p.isVoided}
                          onClick={async () => {
                            if (!confirm('Void this sale?')) return;
                            try {
                              await purchasesApi.void(p.id);
                              fetchSales();
                            } catch (err: any) {
                              alert(err.message || 'Failed to void sale.');
                            }
                          }}
                        >
                          Void
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
