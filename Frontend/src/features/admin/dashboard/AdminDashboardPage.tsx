import { useAdminAuth } from '../../../hooks/useAuth';

function StatIcon({ type }: { type: string }) {
  switch (type) {
    case 'shop':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 8.5L10 3l7 5.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V8.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
          <path d="M7 18v-7h6v7" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
        </svg>
      );
    case 'plan':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="2" y="2" width="16" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.6"/>
          <path d="M6 10h8M6 7h5M6 13h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      );
    case 'trial':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.6"/>
          <path d="M10 6v4.5l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      );
    default:
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="2" y="5" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.6"/>
          <path d="M2 9h16" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M6 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      );
  }
}

export default function AdminDashboardPage() {
  const { admin } = useAdminAuth();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const stats = [
    { label: 'Total Shops',    value: '0', icon: 'shop',    color: 'maroon' },
    { label: 'Active Plans',   value: '0', icon: 'plan',    color: 'green'  },
    { label: 'Trial Shops',    value: '0', icon: 'trial',   color: 'amber'  },
    { label: 'Monthly Billing',value: '0', icon: 'billing', color: 'blue'   },
  ];

  return (
    <>
      <header className="adm-topbar">
        <span className="adm-topbar-title">Dashboard</span>
        <span className="adm-topbar-badge">
          <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="currentColor"/></svg>
          Live
        </span>
      </header>

      <div className="adm-page">
        <div className="adm-page-header">
          <div>
            <h1 className="adm-page-title">{greeting}, {admin?.name ?? 'Admin'} 👋</h1>
            <p className="adm-page-subtitle">Here's what's happening across your platform today.</p>
          </div>
        </div>

        <div className="adm-stats-grid">
          {stats.map((s) => (
            <div key={s.label} className="adm-stat">
              <div className={`adm-stat-icon adm-stat-icon--${s.color}`}>
                <StatIcon type={s.icon} />
              </div>
              <div>
                <div className="adm-stat-value">{s.value}</div>
                <div className="adm-stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="adm-card">
          <div className="adm-card-header">
            <span className="adm-card-title">Recently Joined Shops</span>
            <a href="/admin/shops" className="adm-btn adm-btn--ghost" style={{ fontSize: '0.78rem', padding: '5px 12px' }}>
              View all →
            </a>
          </div>
          <div className="adm-card-body" style={{ padding: '0' }}>
            <div className="adm-table-wrap" style={{ borderRadius: 0, border: 'none', boxShadow: 'none' }}>
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Shop Name</th>
                    <th>Plan</th>
                    <th>Status</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={4}>
                      <div className="adm-empty">
                        <div className="adm-empty-icon">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M3 12.5L12 4l9 8.5V21a1 1 0 01-1 1H4a1 1 0 01-1-1v-8.5z" stroke="currentColor" strokeWidth="1.5"/>
                          </svg>
                        </div>
                        <div className="adm-empty-title">No shops connected yet</div>
                        <div className="adm-empty-desc">New shop registrations will appear here.</div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
