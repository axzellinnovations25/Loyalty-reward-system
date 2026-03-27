import { useState } from 'react';

// Real type placeholder for later integration
interface Payment {
  id: string;
  shop: string;
  plan: string;
  amount: number;
  month: string;
  paidOn: string;
  notes: string;
}

const PLAN_BADGE: Record<string, string> = {
  pro:        'adm-badge--maroon',
  standard:   'adm-badge--blue',
  basic:      'adm-badge--gray',
  enterprise: 'adm-badge--green',
};

export default function BillingPage() {
  const [search, setSearch] = useState('');

  const payments: Payment[] = [];

  const filtered = payments.filter(
    (p) =>
      p.shop.toLowerCase().includes(search.toLowerCase()) ||
      p.plan.toLowerCase().includes(search.toLowerCase()) ||
      p.month.toLowerCase().includes(search.toLowerCase()),
  );

  const totalRevenue = filtered.reduce((sum, p) => sum + p.amount, 0);

  return (
    <>
      <header className="adm-topbar">
        <span className="adm-topbar-title">Billing</span>
      </header>

      <div className="adm-page">
        <div className="adm-page-header">
          <div>
            <h1 className="adm-page-title">Billing & Payments</h1>
            <p className="adm-page-subtitle">Track subscription payments and record new billing entries.</p>
          </div>
          <button className="adm-btn adm-btn--primary">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            Record Payment
          </button>
        </div>

        {/* Revenue summary card */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px', marginBottom: '22px' }}>
          {[
            { label: 'Filtered Revenue',  value: `LKR ${totalRevenue.toLocaleString()}` },
            { label: 'This Month',        value: `LKR 0` },
            { label: 'Payments Recorded', value: String(filtered.length) },
          ].map(({ label, value }) => (
            <div key={label} className="adm-stat">
              <div>
                <div className="adm-stat-value" style={{ fontSize: '1.25rem' }}>{value}</div>
                <div className="adm-stat-label">{label}</div>
              </div>
            </div>
          ))}
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
              placeholder="Search shop, plan or month…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
            {filtered.length} record{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table */}
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Shop</th>
                <th>Plan</th>
                <th>Period</th>
                <th>Amount (LKR)</th>
                <th>Paid On</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="adm-empty">
                      <div className="adm-empty-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <rect x="2" y="5" width="20" height="15" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M2 10h20" stroke="currentColor" strokeWidth="1.5"/>
                        </svg>
                      </div>
                      <div className="adm-empty-title">No billing records</div>
                      <div className="adm-empty-desc">Record a payment to get started.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((p, i) => (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{p.shop}</td>
                    <td>
                      <span className={`adm-badge ${PLAN_BADGE[p.plan] ?? 'adm-badge--gray'}`} style={{ textTransform: 'capitalize' }}>
                        {p.plan}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{p.month}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--a-700)' }}>
                        {p.amount.toLocaleString()}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{p.paidOn}</td>
                    <td>
                      {p.notes ? (
                        <span className="adm-badge adm-badge--amber">{p.notes}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
