import { useMemo, useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import ChangePasswordModal from '../../features/auth/ChangePasswordModal';
import './shop-layout.css';

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
  group?: string;
}

const NAV_ITEMS: NavItem[] = [
  { 
    label: 'Dashboard', 
    path: '/dashboard', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
      </svg>
    )
  },
  { 
    label: 'Customers', 
    path: '/customers', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
      </svg>
    )
  },
  { 
    label: 'POS', 
    path: '/pos', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="3" y1="9" x2="21" y2="9"></line>
        <line x1="9" y1="21" x2="9" y2="9"></line>
      </svg>
    )
  },
  { 
    label: 'Sales', 
    path: '/sales', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18"></path>
        <path d="M19 9l-5 5-4-4-3 3"></path>
      </svg>
    )
  },
  {
    label: 'Reports',
    path: '/reports',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18"></path>
        <rect x="7" y="12" width="3" height="5"></rect>
        <rect x="12" y="8" width="3" height="9"></rect>
        <rect x="17" y="5" width="3" height="12"></rect>
      </svg>
    )
  },
  { 
    label: 'Gift Cards', 
    path: '/gift-cards', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2"></rect>
        <line x1="2" y1="10" x2="22" y2="10"></line>
      </svg>
    )
  },
  { 
    label: 'Messages', 
    path: '/messages', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    )
  },
  { 
    label: 'Rewards', 
    path: '/rewards', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="7"></circle>
        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
      </svg>
    )
  },
  {
    label: 'Redeem',
    path: '/redeem',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 12v10H4V12"></path>
        <path d="M2 7h20v5H2z"></path>
        <path d="M12 22V7"></path>
      </svg>
    )
  },
  { 
    label: 'Staff', 
    path: '/users', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
      </svg>
    )
  },
  { 
    label: 'Products', 
    path: '/products', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
      </svg>
    )
  },
  {
    label: 'Inventory',
    path: '/inventory',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
        <path d="M3.3 7 12 12l8.7-5"></path>
        <path d="M12 22V12"></path>
      </svg>
    )
  },
  {
    label: 'Shifts',
    path: '/shifts',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2"></rect>
        <path d="M2 10h20"></path>
        <path d="M7 15h.01M11 15h2"></path>
      </svg>
    )
  },
  {
    label: 'Operations',
    path: '/operations',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7h18"></path>
        <path d="M6 7v13"></path>
        <path d="M18 7v13"></path>
        <path d="M9 12h6"></path>
        <path d="M9 16h6"></path>
      </svg>
    )
  },
  { 
    label: 'Promotions', 
    path: '/promotions', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41L12 22l-8.59-8.59A2 2 0 0 1 3 12V3h9a2 2 0 0 1 1.41.59l7.18 7.18a2 2 0 0 1 0 2.64z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    )
  },
  { 
    label: 'Settings', 
    path: '/settings', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 1.25 0l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
      </svg>
    )
  },
];

interface ShopLayoutProps {
  children: ReactNode;
}

export default function ShopLayout({ children }: ShopLayoutProps) {
  const { user, clearAuth } = useAuth();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const location = useLocation();
  const isPos = location.pathname.startsWith('/pos');
  const isStaff = user?.role === 'staff';

  const visibleNavItems = useMemo(() => {
    if (!isStaff) return NAV_ITEMS;
    return NAV_ITEMS.filter((i) => i.path === '/pos' || i.path === '/sales' || i.path === '/shifts');
  }, [isStaff]);

  const rootClassName = useMemo(() => {
    const classes = ['shop-layout-root'];
    if (location.pathname.startsWith('/pos')) classes.push('pos-fullscreen');
    return classes.join(' ');
  }, [location.pathname]);

  return (
    <div className={rootClassName}>
      {/* Top Bar Navigation */}
      {!isPos && (
        <header className="shop-topbar">
          {/* Brand */}
          <NavLink to="/dashboard" className="shop-logo-wrap">
            <div className="shop-logo-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
              </svg>
            </div>
            <span className="shop-logo-text">LoyaltyOS</span>
          </NavLink>

          {/* Navigation Links */}
          <nav className="shop-top-nav">
            {visibleNavItems.map((item) => (
              <NavLink 
                key={item.path} 
                to={item.path} 
                className={({ isActive }) => `shop-nav-link ${isActive ? 'active' : ''}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* User Profile & Actions */}
          <div className="shop-topbar-right">
            <div className="shop-user-profile">
              <div className="shop-user-avatar">
                {user?.name?.[0]?.toUpperCase() || 'C'}
              </div>
              <div className="shop-user-name">{user?.name}</div>
            </div>
            
            <div className="shop-topbar-actions">
              <button 
                type="button"
                className="shop-logout-btn" 
                onClick={() => setIsChangePasswordOpen(true)} 
                title="Change Password"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </button>
              <button 
                type="button" 
                className="shop-logout-btn" 
                onClick={clearAuth} 
                title="Log out"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            </div>
          </div>
        </header>
      )}

      {isChangePasswordOpen && user && (
        <ChangePasswordModal 
          onClose={() => setIsChangePasswordOpen(false)} 
        />
      )}

      {/* Main Content Area */}
      <main className="shop-main">
        <div className="shop-page-wrapper">
          {children}
        </div>
      </main>
    </div>
  );
}
