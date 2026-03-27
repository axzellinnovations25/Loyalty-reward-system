import { useState } from 'react';

// Real type placeholder for later integration
interface Shop {
  id: string;
  name: string;
  plan: string;
  status: string;
  contact: string;
  joined: string;
}

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

export default function ShopsPage() {
  const [search, setSearch] = useState('');
  
  // Empty data for now
  const shops: Shop[] = [];

  const filtered = shops.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.plan.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <header className="adm-topbar">
        <span className="adm-topbar-title">Shops</span>
      </header>

      <div className="adm-page">
        <div className="adm-page-header">
          <div>
            <h1 className="adm-page-title">All Shops</h1>
            <p className="adm-page-subtitle">Manage registered shops, plans, and trial access.</p>
          </div>
          <button className="adm-btn adm-btn--primary">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
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
              placeholder="Search shops or plans…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
            {filtered.length} shop{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="adm-empty">
                      <div className="adm-empty-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <path d="M3 12.5L12 4l9 8.5V21a1 1 0 01-1 1H4a1 1 0 01-1-1v-8.5z" stroke="currentColor" strokeWidth="1.5"/>
                        </svg>
                      </div>
                      <div className="adm-empty-title">
                        {search ? "No shops found" : "No shops yet"}
                      </div>
                      <div className="adm-empty-desc">
                        {search ? "Try adjusting your search query." : "Shops added to the system will appear here."}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((shop, i) => (
                  <tr key={shop.id}>
                    <td style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{shop.name}</td>
                    <td style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '0.82rem' }}>{shop.contact}</td>
                    <td>
                      <span className={`adm-badge ${PLAN_BADGE[shop.plan] ?? 'adm-badge--gray'}`} style={{ textTransform: 'capitalize' }}>
                        {shop.plan}
                      </span>
                    </td>
                    <td>
                      <span className={`adm-badge ${STATUS_BADGE[shop.status] ?? 'adm-badge--gray'}`}>
                        <span className="adm-badge-dot" />
                        {shop.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{shop.joined}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="adm-btn adm-btn--ghost" style={{ padding: '5px 10px', fontSize: '0.78rem' }}>
                          Manage
                        </button>
                        <button className="adm-btn adm-btn--danger" style={{ padding: '5px 10px', fontSize: '0.78rem' }}>
                          Disable
                        </button>
                      </div>
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
