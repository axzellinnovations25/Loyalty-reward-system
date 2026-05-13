import { useState } from 'react';
import './billing.css';

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
          <button type="button" className="adm-btn adm-btn--primary">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            Record Payment
          </button>
        </div>

        {/* Revenue summary cards */}
        <div className="billing-stats-grid">
          {[
            { label: 'Filtered Revenue',  value: `LKR ${totalRevenue.toLocaleString()}` },
            { label: 'This Month',        value: `LKR 0` },
            { label: 'Payments Recorded', value: String(filtered.length) },
          ].map(({ label, value }) => (
            <div key={label} className="adm-stat">
              <div>
                <div className="adm-stat-value billing-stat-value">{value}</div>
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
          <span className="billing-record-count">
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
                    <td className="billing-td-index">{i + 1}</td>
                    <td className="billing-td-shop">{p.shop}</td>
                    <td>
                      <span className={`adm-badge billing-badge-capitalize ${PLAN_BADGE[p.plan] ?? 'adm-badge--gray'}`}>
                        {p.plan}
                      </span>
                    </td>
                    <td className="billing-td-secondary">{p.month}</td>
                    <td>
                      <span className="billing-amount">{p.amount.toLocaleString()}</span>
                    </td>
                    <td className="billing-td-secondary">{p.paidOn}</td>
                    <td>
                      {p.notes ? (
                        <span className="adm-badge adm-badge--amber">{p.notes}</span>
                      ) : (
                        <span className="billing-empty-dash">—</span>
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
