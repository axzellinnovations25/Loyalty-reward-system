import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../hooks/useAuth';
import '../../admin.css';

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/admin/dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    label: 'Shops',
    path: '/admin/shops',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 6.5L8 2l6 4.5V14a1 1 0 01-1 1H3a1 1 0 01-1-1V6.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M6 15V9h4v6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    label: 'Plans',
    path: '/admin/plans',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M4 8h8M4 5h5M4 11h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: 'Billing',
    path: '/admin/billing',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="4" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M1 7h14" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M4 10.5h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
];

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { admin, clearAdminAuth } = useAdminAuth();
  const navigate = useNavigate();

  function handleLogout() {
    clearAdminAuth();
    navigate('/admin/login', { replace: true });
  }

  const initials = admin?.name
    ? admin.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'A';

  return (
    <div className="admin-root">
      <div className="admin-shell">
        {/* ── Sidebar ── */}
        <aside className="adm-sidebar">
          {/* Brand */}
          <div className="adm-sidebar-brand">
            <div className="adm-sidebar-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L18 6.5v7L10 18 2 13.5v-7L10 2z" fill="rgba(255,255,255,0.9)"/>
                <path d="M7 10l2.5 2.5L13 8" stroke="#8b0020" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <span className="adm-sidebar-name">LoyaltyOS</span>
              <span className="adm-sidebar-tag">Admin Portal</span>
            </div>
          </div>

          {/* Nav */}
          <nav className="adm-nav">
            <div className="adm-nav-label">Navigation</div>
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `adm-nav-link${isActive ? ' active' : ''}`
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="adm-sidebar-footer">
            <div className="adm-avatar">{initials}</div>
            <div className="adm-footer-info">
              <div className="adm-footer-name">{admin?.name ?? 'Admin'}</div>
              <div className="adm-footer-role">Super Admin</div>
            </div>
            <button
              className="adm-logout-btn"
              onClick={handleLogout}
              title="Sign out"
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M5 13H3a1 1 0 01-1-1V3a1 1 0 011-1h2M10 10l3-3-3-3M13 7H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <div className="adm-main">
          {children}
        </div>
      </div>
    </div>
  );
}
